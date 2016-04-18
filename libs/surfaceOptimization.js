// array of index(in vertexAdjacency array) from the constrain vertex 
var FixedVertex=[];
var FreeVertex=[];
var L={};
var LtL={};

//var FreeVertex=[];

//by cotangent formula
//input array index from the half edge
function meanCurvaturesCurveCotangent(hecurve){
   var n=hecurve.length;
   var result=[];
   
   for(var i=0;i<n;i++){
       var hs = hecurve[i];
       var hf=hs;
       console.log("hs ",hs);
       var vetor=new THREE.Vector3(0.0, 0.0, 0.0);    
       do {
		   var h2 = hemesh.halfedgeNext(hf);
           var h3=-1,h4=-1,h5=-1,h6=-1;
           if(hemesh.halfedgeValid(h2)){
              h3 = hemesh.halfedgeNext(h2); 
           }
           var h4 = hemesh.halfedgeOpposite(hf);
           if(hemesh.halfedgeValid(h4)){
              h5 = hemesh.halfedgeNext(h4);  
           }
           if(hemesh.halfedgeValid(h5)){
              h6 = hemesh.halfedgeNext(h5);  
           }
           
           if(h6!=-1){
               var u = hemesh.halfedgeDirection(h3);
               var v = hemesh.halfedgeDirection(hemesh.halfedgeOpposite(h2));
               var uo = hemesh.halfedgeDirection(h6);
               var vo = hemesh.halfedgeDirection(hemesh.halfedgeOpposite(h5));
               var cotansum=u.dot(v)/u.clone().cross(v).length()+uo.dot(vo)/uo.clone().cross(vo).length();
               var pjpi=hemesh.positions[hemesh.halfedgeVertex(h4)].clone().sub(hemesh.halfedgeVertex(hf));

               vetor.add(pjpi.multiplyScalar(cotansum));
           }
           else{
                var pointGeometry = new THREE.Geometry();
                var pointmaterial = new THREE.PointsMaterial( {color: 0x27B327, size: 5.0, sizeAttenuation: false, alphaTest: 0.5 } );
                pointGeometry.vertices.push(hemesh.positions[hemesh.halfedgeVertex(hf)],hemesh.positions[hemesh.halfedgeVertex(h4)]);
                var particles=new THREE.Points(pointGeometry,pointmaterial);
                setup.scene.add(particles);
           }
           hf = hemesh.halfedgeSinkCCW(hf);
           console.log("hf ",hf);
       } while( (hf !== hs) && (hf != -1));
       result.push(0.5*vetor.length());
   }
   return result;    
}

function CurvatureVertexPlane(lvertex,vertex,rvertex){
        var v1=vertex.clone().sub(lvertex);
        var v2=rvertex.clone().sub(vertex)
        var mod1=v1.length();
        var mod2=v2.length();
        var angle= Math.acos(v1.dot(v2)/(mod1*mod2));
        //console.log(Math.sin(angle));
        return (4*Math.sin(angle/2)/(mod1+mod2));
}

//input: array of index in  VertexAdjacency
function FirstCurvaturesCurve(){
     var n=FixedVertex.length;
     var result=[Math.abs(CurvatureVertexPlane(hemesh.positions[FixedVertex[n-1]],hemesh.positions[FixedVertex[0]],hemesh.positions[FixedVertex[1]]))];
     for(var i=1;i<n;i++){
         result.push(Math.abs(CurvatureVertexPlane(hemesh.positions[FixedVertex[i-1]],hemesh.positions[FixedVertex[i]],hemesh.positions[FixedVertex[(i+1)%n]])));
     }
     return result;
}

//Laplacian for non-constrained vertex
function uniformLaplacian(){
    var n=hemesh.positions.length;
    var L=zeros(n,n);
    var result=[];
    for(var i=0;i<n;i++){
        result.push(hemesh.vertexValence(i));
        for(var j=0;j<n;j++){
            if(i==j){
                L.val[i*L.n+j]=1.0;    
            }
            else{
                var hs=hemesh.findHalfedge(i,j);
                if(hemesh.halfedgeValid(hs)){
                    L.val[i*L.n+j]=-1/hemesh.vertexValence(i);
                }
            }
        }
    }
    console.log("Laplacian finish");
    return L;
}

function FisrtIterationCurvaturesProcess(){
    
    var n=L.n;
    var m=n+FixedVertex.length;
    var A=zeros(m,n);
    var b=zeros(m);
    var bconstrain=FirstCurvaturesCurve();
    for(var i=n;i<m;i++){
        b[i]=bconstrain[i-n];
        for(j=0;j<n;j++){
            if(FixedVertex.indexOf(j)!=-1){
              A.val[i*A.n+j]=1.0;            
            }
        }
    }
    for(var i=0;i<n;i++){
        for(j=0;j<n;j++){
            A.val[i*A.n+j]=L.val[i*L.n+j];       
        }
    }
    var c=cgnr(A,b);
    console.log("First cuvature iteration finish");
    //console.log(c.length);
    Ltl=mulMatrixMatrix(transposeMatrix(L),L);
    var c2=mulMatrixVector(inv(Ltl),mulMatrixVector(L,b));
    console.log(norm(c2-c));
    console.log("comprovation finish");
    return c;
}
//weight was advice from Andrew Nealen
function IterationCurvaturesProcess(cc){
    var n=L.n;
    var A=zeros(2*n,n);
    var b=zeros(2*n);
    for(var i=n;i<2*n;i++){
        // 1.0 for fixed vertices
        if(FixedVertex.indexOf(i)!=-1){
              b[i]=cc[i-n];       
        }
        else{
            // use 0.1 for free vertices
            b[i]=0.1*cc[i-n];
        }
        for(j=0;j<n;j++){
            // 1.0 for fixed vertices
            if(FixedVertex.indexOf(j)!=-1){
              A.val[i*A.n+j]=1.0;       
            }
            else{// 0.1 for free vertices
              A.val[i*A.n+j]=0.1;           
            }
        }
    }
    for(var i=0;i<n;i++){
        for(j=0;j<n;j++){
            A.val[i*A.n+j]=L.val[i*L.n+j];       
        }  
    }
    var c=cgnr(A,b);
    console.log(c.length);
    return c;
}
function computeAverageEdgeLength(){
    var n=hemesh.positions.length;
    var result=[];
    for(var i=0;i<n;i++){
        var h=hemesh.vertexHalfedge(i);
        var ael=0;
        var val=0;
        hemesh.vertexCirculator(function(he){
            var ohe=hemesh.halfedgeOpposite(he);
            var vohe=hemesh.halfedgeVertex(ohe);
            var len=hemesh.positions[i].clone().sub(hemesh.positions[vohe]).length();
            ael=ael+len;
            val++;
        },h);
        ael=ael/val;
        result.push(ael);
    }
    return result;
}
function FisrtIterationEdgeLength(){
    var n=L.n;
    var m=n+FixedVertex.length;
    var A=zeros(m,n);
    var b=zeros(m);
    var bconstrain= mulScalarVector(lengthPointSample/pointSample.length,ones(m-n));
    for(var i=n;i<m;i++){
        b[i]=bconstrain[i-n];
        for(j=0;j<n;j++){
            if(FixedVertex.indexOf(j)!=-1){
              A.val[i*A.n+j]=1.0;       
            }
        }
    }
    for(var i=0;i<n;i++){
        for(j=0;j<n;j++){
            A.val[i*A.n+j]=L.val[i*L.n+j];       
        }
    }
    var el=cgnr(A,b);
    //console.log(c.length);
    //Ltl=transpose(L)*L;
    console.log("First edge iteration finish");
    return el;
}
//weight was advice from Andrew Nealen
function IterationEdgeLength(el){
    var n=L.n;
    var A=zeros(2*n,n);
    var b=zeros(2*n);
    for(var i=n;i<2*n;i++){
        // 1.0 for fixed vertices
        if(FixedVertex.indexOf(i)!=-1){
              b[i]=el[i-n];       
        }
        else{
            // use 0.1 for free vertices
            b[i]=0.1*el[i-n];
        }
        for(j=0;j<n;j++){
            // 1.0 for fixed vertices
            if(FixedVertex.indexOf(j)!=-1){
              A.val[i*A.n+j]=1.0;       
            }
            else{// 0.1 for free vertices
              A.val[i*A.n+j]=0.1;           
            }
        }
    }
    for(var i=0;i<n;i++){
        for(j=0;j<n;j++){
            A.val[i*A.n+j]=L.val[i*L.n+j];       
        }  
    }
    var el=cgnr(A,b);
    console.log(el.length);
    return el;
}
function computeEdgeVector(){
    var n=FixedVertex.length;
    function eta(i,j,v){
        this.i=i;
        this.j=j;
        this.vector=v;
    }
    var resultij=[];
    var result=[];
    var edgeLength=computeAverageEdgeLength();
    for(var i=0;i<n;i++){
        var h=hemesh.vertexHalfedge(FixedVertex[i]);
        hemesh.vertexCirculator(function(he){
            var i=hemesh.halfedgeVertex(he);
            var j=hemesh.halfedgeSource(he);
            resultij.push([i,j]);
        },h);
    }
    for(var i=0;i<resultij.length;i++){
        var s=(edgeLength[resultij[i][0]]+edgeLength[resultij[i][1]])/2;
        var v=hemesh.positions[resultij[i][0]].clone().sub(hemesh.positions[resultij[i][1]]);
        v.normalize();
        v.multiplyScalar(s);
        result.push(new eta(resultij[i][0],resultij[i][1],v));
    }
    console.log("compute edge vector finish");
    return result;
}
function computeIntegratedLaplacian(curvature){
    
    var n=curvature.length;
    var result=[];    
    for(var i=0;i<n;i++){
        //compute Ai and ni
        var area=0;
        var normal=new THREE.Vector3(0,0,0);
        var h=hemesh.vertexHalfedge(i);
        var t=0;
        hemesh.vertexCirculator(function(he){
            var face=hemesh.halfedgeFace(he);
            var verts=hemesh.faceVertices(face);
            var c = new THREE.Vector3();
            area+=hemesh.faceArea(face);
            c.crossVectors(hemesh.positions[verts[2]].clone().sub(hemesh.positions[verts[0]]),hemesh.positions[verts[1]].clone().sub(hemesh.positions[verts[0]]));
            normal.add(c);
            t++;
        },h);
        area=area/3;
        normal=normal.divideScalar(t);
        //compute laplacian i
        var laplaciani=normal.multiplyScalar(area*curvature[i]);
        result.push(laplaciani);
    }
    console.log("compute integrated laplacian finish");
    return result;
}

//weight was advice from Andrew Nealen
function IterationUpdateVector(lapla,etaarray){
    var n=lapla.length;
    var m=etaarray.length;
    var r=FixedVertex.length;
    var A=zeros(n+r+m,n);
    var b=zeros(n+r+m,3);
    for(var i=0;i<n;i++){
        for(j=0;j<n;j++){
            A.val[i*A.n+j]=L.val[i*L.n+j];       
        }
        b.val[i*A.n]=lapla[i].x;
        b.val[i*A.n+1]=lapla[i].y;
        b.val[i*A.n+2]=lapla[i].z;
    }
    for(var i=n;i<n+r;i++){
        // 100.0 for fixed vertices
        b.val[i*A.n]=100*hemesh.positions[FixedVertex[i-n]].x;
        b.val[i*A.n+1]=100*hemesh.positions[FixedVertex[i-n]].y;
        b.val[i*A.n+2]=100*hemesh.positions[FixedVertex[i-n]].z;
        for(j=0;j<n;j++){
            // 100.0 for fixed vertices
            if(FixedVertex.indexOf(j)!=-1){
              A.val[i*A.n+j]=100.0;       
            }
        }
    }
     // 0.01 for vertices in B subset
    var wel=0.0;
    for(var i=n+r;i<n+r+m;i++){
        b.val[i*A.n]=wel*etaarray[i-n-r].vector.x;
        b.val[i*A.n+1]=wel*etaarray[i-n-r].vector.y;
        b.val[i*A.n+2]=wel*etaarray[i-n-r].vector.z;
        A.val[i*A.n+etaarray[i-n-r].i]=wel;
        A.val[i*A.n+etaarray[i-n-r].j]=-wel;
    }
    var bx=getCols(b,[0]);
    var by=getCols(b,[1]);
    var bz=getCols(b,[2]);
    var vx=cgnr(A,bx);
    var vy=cgnr(A,by);
    var vz=cgnr(A,bz);
    for (var i=0;i<n;i++){
        hemesh.positions[i].set(vx[i],vy[i],vz[i]);
    }
    var mesh=setup.scene.getObjectByName("mesh");
    
    var wireframe=setup.scene.getObjectByName("wireframe");
    
    mesh.geometry.verticesNeedUpdate = true;
	
	setup.scene.remove(wireframe);
	wireframeLines = hemesh.toWireframeGeometry();
    var wireframe = new THREE.LineSegments(wireframeLines, new THREE.LineBasicMaterial({
        color: 0xff2222,
        opacity: 0.2,
        transparent: true,
    }));
	setup.scene.add(wireframe);
    console.log("update vertex finish");
}