//
// Model for a piece of paper that can be bent and cut.
// vertices must be an array of PVector objects and faces
// must be an array of arrays of the form [i,j,k] where each
// element is the index of one of the vertices.
//
function PaperModel(faces,vertices) {

	// hds is a halfedge data structure for the model
	this.hds = new HalfedgeDS (faces,vertices); 

	// vecVertex is an array of vertex positions represented as THREE.Vector3 objects
	this.computeVectors();

	// edges is a collection of objects representing the edges of the paper
	// triangulation.
	this.edges = [];
	this.computeEdges();
}

//
// Computes an array of vertex positions represented as THREE.Vector3 objects.
// The array is stored in the object and also returned by the function.
//
PaperModel.prototype.computeVectors = function () {
	this.vecVertex = []; 
	var obj = this;
	this.hds.allVertices (function (he,v) {
		obj.vecVertex [he.vtx] = new THREE.Vector3 (v.x, v.y, v.z);
	});
	return this.vecVertex;
}

//
// Recomputes the vecVertex array after changing the position of
// the vertices in the halfedge data structure. This makes it possible
// to obviate the recomputation of the THREE objects.
//
PaperModel.prototype.updateVectors = function () {
	var obj = this;
	this.hds.allVertices (function (he,v) {
		obj.vecVertex [he.vtx].set (v.x, v.y, v.z);
	});
}

//
// Returns a THREE.Mesh object representing the paper surface. fmaterial maps an integer
// number representing a connected component of the mesh to a material
// 
PaperModel.prototype.mesh = function (fmaterial) {

	this.computeComponents();

	// surface is an array of THREE.Geometry object, each representing
	// a component of the paper surface
	var surface = [];
	for (var i = 0; i < this.groupCount; i++) {
		surface[i] = new THREE.Geometry();
		surface[i].vertices = this.vecVertex;
	}

	var obj = this;
	this.hds.allFaces (function (he) {
		var v0 = he.vtx;
		he = obj.hds.halfedge[he.nxt];
		var v1 = he.vtx;
		he = obj.hds.halfedge[he.nxt];
		var v2 = he.vtx;
		var igroup = obj.faceGroup[he.fac]; 
		surface[igroup].faces.push (new THREE.Face3(v0,v1,v2));
	});

	var result = new THREE.Object3D();
	for (var i = 0; i < this.groupCount; i++) {
		surface[i].computeFaceNormals();
		result.add(new THREE.Mesh( surface[i], fmaterial(i)));
	}
	return result;
}

// 
// Returns a THREE.Object3D object representing the edges of the paper
// triangulation where each edge is given a material that can be informed
// by the user using parameter fmaterial, which is a function that receives
// an edge object and returns a THREE.Material object
//
PaperModel.prototype.wireframe = function (fmaterial) {

	this.computeEdges();

	var obj = new THREE.Object3D ();
	for (var i in this.edges) {
		var e = this.edges[i];
		var line = new THREE.Line (e.geometry,fmaterial (e));
		obj.add (line);
	}

	return obj;
}

//
// Copy edge attributes to the halfedges they correspond to.
// 
PaperModel.prototype.decorateHalfedges = function () {

	if (this.edges != undefined) {
		for (var i in this.edges) {
			var e = this.edges[i];
			var he = e.halfedge;
			var ohe = this.hds.halfedge[he.opp];
			if (he.fac < 0 || ohe.fac < 0) he.type = ohe.type = "Border";
			else he.type = ohe.type = e.type;
			he.len = ohe.len = e.len;
		}
	}
}

//
// Clean up the extraneous fields we have placed in the halfedges,
// i.e., undoes decorateHalfedges
//
PaperModel.prototype.plainHalfedges = function () {
	for (var i = 0; i < this.hds.halfedge.length; i++) {
		var he = this.hds.halfedge[i];
		if (he != undefined) {
			he.type = undefined;
			he.len = undefined;
		}
	}
}

//
// Compute connected components for the halfedge faces, i.e., consider
// border,ridge and valley edges as fences between the components.
// 
PaperModel.prototype.computeComponents = function () {

	var self = this;
	self.faceGroup = [];
	var fg = self.faceGroup;
	self.decorateHalfedges();

	// Put the first face in the queue
	var faceStack = [];
	var groupCount = 0;
	self.hds.allFaces(function (fhe) {
		var iface = fhe.fac;
		if (fg[iface] != undefined) return;
		faceStack.push(iface);
		while (faceStack.length>0) {
			var j = faceStack.pop();
			if (fg [j] == undefined) {
				fg [j] = groupCount;
				var jhe = self.hds.halfedge[self.hds.faceh[j]];
				self.hds.faceCirculator(function (he) {
					if (he.type == "Flat") {
						var ohe = self.hds.halfedge[he.opp];
						var neighbor = ohe.fac;
						if (fg [neighbor] == undefined) {
							faceStack.push(neighbor);
						}
					}
				}, jhe);
			}
		}
		groupCount++;
	});
	console.log (groupCount+" components");
	self.groupCount = groupCount;
}

//
// Computes/recomputes the edges data structure of the paper model
//
PaperModel.prototype.computeEdges = function () {

	// Remember edge attributes by copying them to the halfedges
	this.decorateHalfedges(); 

	this.edges = [];
	var obj = this;
	this.hds.allEdges (function (he,phe) {
		var ohe = obj.hds.halfedge[he.opp];
		var v0 = obj.vecVertex[he.vtx];
		var v1 = obj.vecVertex[phe.vtx];
		var g = new THREE.Geometry ();
		g.vertices.push (v0,v1);
		g.computeLineDistances();
		var t = he.type;
		if (t == undefined) t = ohe.type;
		if (t == undefined) t = he.fac < 0 || ohe.fac < 0 ? "Border" : "Flat";
		var l = he.len;
		if (l == undefined) l = ohe.len;
		if (l == undefined) l = obj.hds.vertex[he.vtx].sub(obj.hds.vertex[phe.vtx]).mag();
		obj.edges.push ({
			halfedge: he,   // One of the halfedges of this edge
			type: t, // A string representing the type of this edge
			geometry: g, // A Geometry object for this edge
			len: l // The nominal length of this edge
		})
	});

}

//
// Alters the model's halfedge data structure to reflect cuts made in the paper
// i.e., edges of type "Cut".
//
PaperModel.prototype.processCuts = function () {
	var vtxToSnip = [];
	var cutCount = 0;
	// First cut the edges
	for (var i in this.edges) {
		var e = this.edges[i];
		if (e.type == "Cut") {
			e.type = "Flat";
			var opposite = this.hds.halfedge[e.halfedge.opp];
			var v0 = e.halfedge.vtx;
			var v1 = opposite.vtx;
			check_hds(this.hds);
			cutEdge (this.hds, e.halfedge);
			cutCount++;
			if (vtxToSnip.indexOf(v0) < 0) vtxToSnip.push (v0);
			if (vtxToSnip.indexOf(v1) < 0) vtxToSnip.push (v1);
		}
	}
	// Next, separate the vertices of consecutive cut edges
	var snipCount = 0;
	while (vtxToSnip.length > 0) {
		var newvtx_h;
		var i = vtxToSnip[0];
		vtxToSnip.splice(0,1);
		while (newvtx_h = snipVertex(this.hds,i)) {
			snipCount++;
			if (vtxToSnip.indexOf(newvtx_h.vtx) < 0) vtxToSnip.push(newvtx_h.vtx);
		}
	}

	if (cutCount > 0) {
		// If cuts were made, the paper topology has changed and thus the
		// other data structures must be recomputed
		console.log (cutCount+" Cuts and "+snipCount+" Snips");
		this.computeVectors();
		this.computeEdges(true);
	}
}

//
// Computes the linear and dihedral constraints for the paper. 
// Call this before the first call to relaxOneStep
//
PaperModel.prototype.computeConstraints = function () {

	// First make sure that all cuts are processed
	this.processCuts();
	this.computeComponents();

	this.lc = [];   // Linear constraints
	this.dc = [];   // Dihedral constraints
	this.fc = [];   // Dihedral constraints for flat edges
	var angsum = 0, linsum = 0;
	for (var i in this.edges) {
		var e = this.edges[i];
		var he = e.halfedge;
		var ohe = this.hds.halfedge[he.opp];
		var v0 = this.hds.vertex[he.vtx];
		var v1 = this.hds.vertex[ohe.vtx];
		var constraint = new LinearConstraint (v0,v1,e.len);
		linsum += constraint.discrepancy();
		this.lc.push (constraint);
		if (he.fac >= 0 && ohe.fac >= 0) {
			var v2 = this.hds.vertex[this.hds.halfedge[he.nxt].vtx];
			var v3 = this.hds.vertex[this.hds.halfedge[ohe.nxt].vtx];
			var angle = (e.type == "Ridge") ? Math.PI / 2 :
						(e.type == "Valley") ? -Math.PI / 2:
						0;
			constraint = new DihedralConstraint (v0,v1,v2,v3,angle); 
			angsum += constraint.discrepancy();
			if (angle == 0) {
				this.fc.push (constraint);
				// Add a linear constraint between the opposite vertices of
				// a flat dihedral constraint
                var tmp = [v0.clone(),v1.clone(),v2.clone(),v3.clone()];
                var tmpdc = new DihedralConstraint (tmp[0],tmp[1],tmp[2],tmp[3],0);
                tmpdc.relax(1);
                constraint = new LinearConstraint(v2,v3,tmp[2].sub(tmp[3]).mag());
                linsum += constraint.discrepancy();
                this.lc.push (constraint);
            } else {
            	this.dc.push (constraint);
            }
		}
	};
	console.log ("linear discrepancy "+linsum+", angular discrepancy "+angsum);
}

//
// Sorts constraint array c in decreasing order of discrepancy so that
// higher discrepancies are relaxed earlier. Returns the total discrepancy
//
function sortByDiscrepancy (c) {
    var sum = 0;
    for (var i = 0; i < c.length; i++) {
        c[i].disc = c[i].discrepancy();
        sum += c[i].disc;
    }
    c.sort(function (a,b) { 
        return a.disc < b.disc ? 1 : (a.disc > b.disc ? -1 : 1); 
    });
    return sum;    
}

//
// Performs one step of the relaxation process. Whenever the edges data
// structure is changed, constraints must be created using the computeConstraints
// function and then this function must be called repeatedly
// to achieve the paper's final shape.
//
PaperModel.prototype.relaxOneStep = function () {
	var n = 5;
	var m = 4;
	var nf = 2;
	var nl = 3;
	var lc = this.lc, dc = this.dc, fc = this.fc;
	for (var k = 0; k < n; k++) {
		var f = 0.2 ;//(k+1) / (n);
		//sortByDiscrepancy(dc);
		for (var i = 0; i < dc.length; i++) {
			dc[i].relax(f);
		}
		//sortByDiscrepancy(lc);
		//sortByDiscrepancy(fc);
		for (var count = 0; count < m; count++) {
			for (var j = 0; j < nl; j++) {
				sortByDiscrepancy(lc);
				for (var i = 0; i < lc.length; i++) {
					lc[i].relax();
				}
			}
			for (var j = 0; j < nf; j++) {
				sortByDiscrepancy(fc);
				for (var i = 0; i < fc.length; i++) {
					fc[i].relax(0.1);
				}
			}
		}
	}
	this.updateVectors();
}


//
// Subdivides edges that are bigger than a certain amount
//
PaperModel.prototype.subdivideEdges = function (amt) {

	var visitedVertices = [];
	this.decorateHalfedges();
	var nsub = 0;
	var saveEdges = [];
	for (var i in this.edges) {
		var paperedge = this.edges[i];
		var he = paperedge.halfedge;
		if (he.len > amt && he.type == "Flat") {
			var ohe = this.hds.halfedge[he.opp];
			var v0 = he.vtx;
			var v1 = ohe.vtx;
			if (!visitedVertices[v0] || !visitedVertices[v1]) {
				visitedVertices[v0] = visitedVertices[v1] = true;
				var v2 = this.hds.halfedge[he.nxt].vtx;
				var v3 = this.hds.halfedge[ohe.nxt].vtx;
				visitedVertices[v2] = visitedVertices[v3] = true;
				subdivideEdge (this.hds,he);
				nsub++;
			}
		}
		else {
			saveEdges.push(paperedge);
		}
	}
	console.log (nsub+" subdivided edges");
	this.computeVectors();
	this.edges = saveEdges;
	this.plainHalfedges();
	this.computeEdges();
}

// 
// Visits all vertices internal to the components and perform a 
// laplacian smooth step on them. 
//
PaperModel.prototype.laplacianSmooth = function () {
	var self = this;
	self.decorateHalfedges();
	var saveEdges = [];
	for (var i in this.edges) { 
		var e = this.edges[i];
		if (e.type != "Flat") {
			saveEdges.push(e);
		}
	}
	for (var nsteps = 5; nsteps>0; nsteps--) {
		var visitedVertices = [];
		var nmoved = 0;
		self.hds.allVertices(function(he) {
			var n = 0;
			var pos = new PVector(0,0,0);
			var ok = true;
			var neighbor = [];
			self.hds.vertexCirculator (function (vhe) {
				var ovtx = self.hds.halfedge[vhe.opp].vtx;
				neighbor.push(ovtx);
				ok = ok && /*!visitedVertices[ovtx] && */ vhe.type == "Flat";
				pos = pos.add(self.hds.vertex[ovtx]);
				n++;
			}, he);
			if (ok) {
				pos = pos.mult(1.0/n);
				if (pos.sub(self.hds.vertex[he.vtx]).mag()>1e-5) {
					self.hds.vertex[he.vtx] = pos;
					visitedVertices[he.vtx] = true;
					for (var i in neighbor) visitedVertices [neighbor[i]] = true;
					nmoved++;
				}
			}
		});
		console.log (nmoved+ " vertices moved");
	}
	this.computeVectors();
	this.edges = saveEdges;
	this.plainHalfedges();
	this.computeEdges();
}

//
// Function to build a json object from a PaperModel object
//
function paperModelToJson (paper) {
	var vtxmap = [];
	var vtx = [];
	var fac = [];
	var edg = [];
	paper.hds.allVertices (function (he,v) {
		vtxmap[he.vtx] = vtx.length;
		vtx.push ({x: v.x, y:v.y, z: v.z});
	});
	paper.hds.allFaces (function (he) {
		var heface = [];
		paper.hds.faceCirculator (function (fhe) {
			heface.push (vtxmap[fhe.vtx]);
		}, he);
		fac.push (heface);
	});
	for (var i in paper.edges) {
		var e = paper.edges[i];
		var he = e.halfedge;
		edg.push ({
			v0 : vtxmap [he.vtx],
			v1 : vtxmap [paper.hds.halfedge[he.opp].vtx],
			type : e.type
		})
	}
	return {
		vertices : vtx,
		faces : fac,
		edges : edg
	}
}

// 
// Function to build a PaperModel from a json object
//
function jsonToPaperModel (json) {
	var vtx = [];
	var fac = json.faces;
	for (var i in json.vertices) {
		var v = json.vertices[i];
		vtx.push (new PVector (v.x, v.y, v.z))
	}
	var paper = new PaperModel (fac,vtx);
	var n = 0;
	for (var i in json.edges) {
		var edg = json.edges[i];
		for (var j in paper.edges) {
			var e = paper.edges[j];
			var v0 = e.halfedge.vtx;
			var v1 = paper.hds.halfedge[e.halfedge.opp].vtx;
			if ((v0 == edg.v0 && v1 == edg.v1) || (v1 == edg.v0 && v0 == edg.v1)) {
				e.type = edg.type;
				n++;
				break;
			}
		}
	}
	paper.computeEdges();
	return paper;
}