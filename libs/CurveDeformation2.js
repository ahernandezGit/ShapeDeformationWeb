// two index in FixedVErtex that store the begining and end of wich curve 
var ListOfCurves=[];
var ListOfCurvesGeometry=[];
var ListOfCurvesObject=[];
function planeToDeforming(normal,x,y,z,v){
    this.normal=new THREE.Vector3(normal.x,normal.y,normal.z);
    this.point=new THREE.Vector3(x,y,z);
    this.indexp=v;
}

//part of the mesh to be edit
//v:index in hemesh.positions of the handle
//r: radius of the ROI
function pathToEdit(r,v,c,ci){
    this.useL0=true;
    this.useL0_R=false;
    this.vxyz_rxyz=[];
    this.weight=1;
    this.constrainWeight=100;
    this.flagdifution=false;
    this.olaplacian0=[];
    this.olaplacian1=[];
    this.original_laplacians_P=[];
    this.original_laplacians_L1=[];
    this.IndexVertices=[];
    this.fixedVertices=[];
    this.FixedRotation=[];
    this.EdgeTriplets=[];
    this.R=[];
    this.edges=[];
    this.radius=r;
    this.fixed=[];
    this.boundary=[];
    this.finalFixed=[];
    this.stopGrow=false;
    this.A=[];
    this.b=[];
    this.n_laplacians_P=0;
    this.n_laplacians_R=0;
    this.handle=v;
    this.whatcurve=c;
    this.indexInCurve=ci;
    this.level=0;
    this.js=this.indexInCurve;
    this.jp=this.indexInCurve;
    this.geodesiclength=0;
    this.totalfaces=[];
    this.initialPosition=hemesh.positions[v].clone();
    this.lastMeshPositions=[];
    this.initializeMesh();
}
pathToEdit.prototype.updateRender=function(){
    if(flaglabx && flaglaby && flaglabz){
        console.log("todos true");
        if(this.flagdifution){
            this.finalFixed=[];
            for(var i=0;i<this.fixed.length;i++){
                this.finalFixed.push(this.tableHash[this.fixed[i].toString()]);
            }
            this.finalFixed=this.finalFixed.concat(this.IndexVertices);
            this.updatelaplacians();
            var sopt=new SurfaceOptimization(this.finalFixed,this.laplacian1,this.meshDS);
            sopt.FirstMatrixtoProcessCurvatureEdgeLength();
            var ci=sopt.FisrtIterationCurvaturesProcess();
            var el=sopt.FisrtIterationEdgeLength();
            var etaij=sopt.computeEdgeVector(el);
            var laplacian=sopt.computeIntegratedLaplacian(ci);
            sopt.IterationUpdateVector(laplacian,etaij);    
            setTimeout(sopt.updateRenderMesh,500);
        }
        //var meshROI=setup.scene.getObjectByName("meshROI");
        var mesh=setup.scene.getObjectByName("mesh");
        var wireframeMesh=setup.scene.getObjectByName("wireframeMesh");
        
        //meshROI.geometry.verticesNeedUpdate = true;
        mesh.geometry.verticesNeedUpdate = true;
        ListOfCurvesObject[0].geometry.verticesNeedUpdate = true;
        setup.scene.remove(wireframeMesh);
        var wireframeLines = hemesh.toWireframeGeometry();
        var wireframe = new THREE.LineSegments(wireframeLines, new THREE.LineBasicMaterial({
            color: 0xff2222,
            opacity: 0.2,
            transparent: true,
        }));
        wireframe.name="wireframeMesh";
        setup.scene.add(wireframe);
        cancelRender=false;
        console.log("update render submesh");
        //render();
    }
    else{
        setTimeout(this.updateRender,500);
        console.log("waiting render submesh");
    }
}
pathToEdit.prototype.initializeMesh=function(){
    // relation between index in hemesh positions and index in mesDs positions
    this.tableHash=[];
    this.tableHash[this.handle.toString()]=0;
    this.newfaces=[];
    this.meshDS=new Hemesh(); 
    this.meshDS.addVertex(hemesh.positions[this.handle]);
    this.totalVertices=[this.handle];
    var h=hemesh.vertexHalfedge(this.handle);
    var vertexs=this.boundary;
    var faces=this.newfaces;
    hemesh.vertexCirculator(function(he){
            var vxt=hemesh.halfedgeSource(he);
            var pv=hemesh.positions[vxt];
            vertexs.push(vxt);
            faces.push(hemesh.halfedgeFace(he));
    },h);
    for(var i=0;i<hemesh.positions.length;i++){
        this.lastMeshPositions.push(hemesh.positions[i].clone());    
    }    
}
pathToEdit.prototype.printPoint=function(v){
     var partt=setup.scene.getObjectByName("auxpoint");
     if(partt!= undefined){
        setup.scene.remove(partt);
        partt={};    
     }
     var pointG=new THREE.Geometry();
     pointG.vertices.push(hemesh.positions[v]);
     var pointM=new THREE.PointsMaterial( {color: 0xE62ECD, size: 10.0, sizeAttenuation: false, alphaTest: 0.5 } );
     var partt=new THREE.Points(pointG, pointM);
     partt.name="auxpoint";
     setup.scene.add(partt);
}
pathToEdit.prototype.printCirculator=function(v0,v,v1){
     var h=hemesh.findHalfedge(v0,v);
     var boundary=[];
     var newfaces=[hemesh.halfedgeFace(h)];
     hemesh.vertexCirculator(function(he){
       var nhe=hemesh.halfedgeSinkCCW(he)
       var src=hemesh.halfedgeSource(nhe);
       if(src!=v1){
           boundary.push(src);
           newfaces.push(hemesh.halfedgeFace(he));
           //newfaces.push(hemesh.halfedgeFace(hemesh.halfedgeOpposite(nhe)));
       }
       else{
           newfaces.push(hemesh.halfedgeFace(he));   
           return 1;
       }
    },h);
    var n=boundary.length;
    var partt=setup.scene.getObjectByName("aux");
    var partt0=setup.scene.getObjectByName("aux0");
    var partt1=setup.scene.getObjectByName("aux1");
    if(partt!= undefined){
        setup.scene.remove(partt);
        partt={};    
    }
    if(partt0!= undefined){
        setup.scene.remove(partt0);
        partt0={};    
    }
    if(partt1!= undefined){
        setup.scene.remove(partt1);
        partt1={};    
    }
    var pointG0=new THREE.Geometry();
    var pointG=new THREE.Geometry();
    var pointG1=new THREE.Geometry();
    pointG0.vertices.push(hemesh.positions[boundary[0]]);
    pointG1.vertices.push(hemesh.positions[boundary[boundary.length-1]]);
    for(var i=1;i<n-2;i++){
        pointG.vertices.push(hemesh.positions[boundary[i]]);
    }
    var pointM0=new THREE.PointsMaterial( {color: 0x9E0D31, size: 10.0, sizeAttenuation: false, alphaTest: 0.5 } );
    var pointM=new THREE.PointsMaterial( {color: 0x0A0F0F, size: 10.0, sizeAttenuation: false, alphaTest: 0.5 } );
    var pointM1=new THREE.PointsMaterial( {color: 0x0CC7B1, size: 10.0, sizeAttenuation: false, alphaTest: 0.5 } );
    var partt0=new THREE.Points(pointG0, pointM0);
    var partt=new THREE.Points(pointG, pointM);
    var partt1=new THREE.Points(pointG1, pointM1);
    partt.name="aux";
    partt0.name="aux0";
    partt1.name="aux1";
    setup.scene.add(partt);
    setup.scene.add(partt1);
    setup.scene.add(partt0);
    console.log(boundary);
}
    
pathToEdit.prototype.updateBoundary=function (){
    var boundary=[];
    var n=this.boundary.length;
    var prev=this.boundary[n-1];
    var refboundary=this.boundary;
    var newfaces=[];
    for(var i=0;i<n;i++){    
       var h=hemesh.findHalfedge(prev,this.boundary[i]);
       hemesh.vertexCirculator(function(he){ // in practice is clockwise circulator
           var nhe=hemesh.halfedgeSinkCCW(he)   // in practice is clockwise circulator
           var src=hemesh.halfedgeSource(nhe);  
           if(i<n-1 && src!=refboundary[i+1]){
               boundary.push(src);
               newfaces.push(hemesh.halfedgeFace(nhe));
           }
           else if(i==n-1 && src!=boundary[0]){
               boundary.push(src);
               newfaces.push(hemesh.halfedgeFace(nhe));
           }
           else{
               newfaces.push(hemesh.halfedgeFace(nhe));   
               return 1;
           }
       },h); 
       prev=boundary[boundary.length-1];        
    }
    this.fixed=refboundary.slice();
    this.boundary=boundary;
    this.newfaces=newfaces;
    //this.totalfaces=this.totalfaces.concat(newfaces);
}
pathToEdit.prototype.computeVertex=function (){
        var le=5*this.radius;
        var vertexs=[];
        var center=hemesh.positions[this.handle];
        var js=this.indexInCurve;
        var jp=this.indexInCurve;
        var level=0; 
        var totaldistance=0;
        while(true){   
            var js0=js;
            var jp0=jp;
            js=js+1;
            jp=jp-1;
            if(js==ListOfCurves[this.whatcurve][1]+1){
                js=ListOfCurves[this.whatcurve][0];
            }
            if(jp==ListOfCurves[this.whatcurve][0]-1){
                jp=ListOfCurves[this.whatcurve][1];
            }
            var pjs=hemesh.positions[FixedVertex[js]];
            var pjp=hemesh.positions[FixedVertex[jp]];
            var pjs0=hemesh.positions[FixedVertex[js0]];
            var pjp0=hemesh.positions[FixedVertex[jp0]];
            totaldistance+=pjs.distanceTo(pjs0)+pjp.distanceTo(pjp0);
            if(totaldistance<le){
                level++;
            }
            else{
                js=js0;
                jp=jp0;
                break;
            }   
        }
        //console.log("le",le);
        //console.log(totaldistance);
        this.geodesiclength=totaldistance;
        this.js=js;
        this.jp=jp;
    if(level>this.level){ 
            this.level=level;
            console.log("level ",this.level);
            //var k=this.meshDS.positions.length;
            var k=this.totalVertices.length;
            for(var i=0;i<this.boundary.length;i++){
               //this.meshDS.addVertex(hemesh.positions[this.boundary[i]].clone());
               //this.meshDS.addVertex(hemesh.positions[this.boundary[i]]);
                this.totalVertices.push(this.boundary[i]);
                this.tableHash[this.boundary[i].toString()]=k;
                k++;
            }    
            var faces= this.newfaces;
            this.totalfaces=this.totalfaces.concat(faces);
           
            var ff=[]; 
            for(var i=0;i<this.totalfaces.length;i++){
               var facess=hemesh.faceVertices(this.totalfaces[i]);
               facess.reverse();    
               ff.push([this.tableHash[facess[0].toString()],this.tableHash[facess[1].toString()],this.tableHash[facess[2].toString()]]);
            }
            var vv=[];
            for(var i=0;i<this.totalVertices.length;i++){
               var vxt=hemesh.positions[this.totalVertices[i]];
               vv.push(vxt);
            }
            this.meshDS=new Hemesh(); 
            this.meshDS.fromFaceVertexArray(ff,vv); 
            //this.meshDS.addFaces(ff);
            //this.lastMeshPositions=this.meshDS.positions.slice();
            //compute new boundary
            this.updateBoundary();
            this.rendermesh();
            //this.updatelaplacians();
            //this.computeDeforming();
            //if(this.level>1) this.computeDeforming2();
            //this.updateDeforming();
     }
}
pathToEdit.prototype.rendermesh=function (){
    var meshscene=setup.scene.getObjectByName("meshROI");
    if(meshscene!=undefined){
       setup.scene.remove(meshscene);       
       meshscene={};    
    }
    meshscene=new THREE.Mesh(this.meshDS.toGeometry(), new THREE.MeshBasicMaterial({
        color: 0xE8D120,
        side:  THREE.DoubleSide
    }));
    meshscene.name="meshROI";
    setup.scene.add(meshscene);
    var pointGeometry = new THREE.Geometry();
    for(var i=0;i<this.boundary.length;i++){
        pointGeometry.vertices.push(hemesh.positions[this.boundary[i]]);    
    }
    var pointmaterial = new THREE.PointsMaterial( {color: 0x27B327, size: 10.0, sizeAttenuation: false, alphaTest: 0.5 } );
    var particle=setup.scene.getObjectByName("pruebapar");
    if(particle!=undefined){
        setup.scene.remove(particle);       
        particle={}
    }
    particle=new THREE.Points(pointGeometry, pointmaterial);
    particle.name="pruebapar";
    setup.scene.add(particle);
}
pathToEdit.prototype.setradius=function(nr){
       this.radius=nr;
       //this.computeVertex();
       //console.log(this.freevertex);
       //console.log(this.fixed);
}    
pathToEdit.prototype.updateROIradius=function(){
    var vector = new THREE.Vector3();
    vector.set( mouse.x ,mouse.y , 0.5 );
    vector.unproject( setup.camera);
    var cameraposition=setup.camera.position.clone();
    var dir = vector.sub(cameraposition).normalize();
    var t=plane.point.clone().sub(cameraposition).dot(plane.normal)/dir.dot(plane.normal);
    var point=cameraposition.add(dir.multiplyScalar(t));
    this.radius=point.clone().distanceTo(this.initialPosition);
    this.meshDS.positions[this.tableHash[this.handle.toString()]].set(point.x,point.y,point.z);
    /*var mesh=setup.scene.getObjectByName("mesh");

    var wireframe=setup.scene.getObjectByName("wireframe");
        mesh.geometry.verticesNeedUpdate = true;
        if(wireframe!=undefined){
        setup.scene.remove(wireframe);}
      */  
        //cancelRender=false;
        //render();
    this.computeVertex();
    //console.log(this.radius);
}
pathToEdit.prototype.updatelaplacians=function(){
    var n=this.meshDS.positions.length;
    //var L0=zeros(n-1,n);
    var L1=zeros(n,n);
    var v=zeros(n,3);
    var copy=this.meshDS;
    //console.log(copy);
    for(var i=0;i<n;i++){
        L1.val[i*n+i]=1.0;    
        var h=this.meshDS.vertexHalfedge(i);
        //Important! Here compute vertex valence consider that HE structure fail in this local submesh
        // This would not be necessary if this.meshDS.vertexValence working fine.
        var hs=h;
        var ah=h;
        var max=20;
        var neibor=[];
        //get the most left halfedge to h
        while (true) {
            ah=h;
            var src=copy.halfedgeSource(h);
            //console.log(src);
            if(neibor.length!=0 ){
                if(src!=neibor[neibor.length-1]){
                        neibor.push(src);
                }
            }
            else{
                neibor.push(src);
            }
            h = copy.halfedgeSinkCW(h);
            //console.log(h);
            if (h === hs){
                if(copy.halfedgeSource(ah)==neibor[0]){
                    neibor.pop();      
                }
                break; 
            } 
            if (h<0){ 
                //console.log("existe he -1");
                //console.log("vertex",i);
                //console.log(neibor);
                break;
            }
            if (max--== 0){
                  console.log(hs);
                  console.log(h);
                  console.log(i);
                  console.log(neibor);
                  throw "Corrupt hds in vertex circulation non negative";  
            } 
	    }
        if(h<0){
            h=ah;
            hs=ah;
            neibor=[];
            max=20;
            while (true) {
                ah=h;
                var src=copy.halfedgeSource(h);
                if(neibor.length!=0 ){
                    if(src!=neibor[neibor.length-1]){
                            neibor.push(src);
                    }
                }
                else{
                        neibor.push(src);
                }
                h = copy.halfedgeSinkCCW(h);
                if (h<0 || h==hs) {
                    if(copy.halfedgeSource(ah)==neibor[0]){
                        neibor.pop();      
                    }
                    break; 
                } 
                if (max--== 0){
                  console.log(hs);
                  console.log(h);    
                  throw "Corrupt hds in vertex circulation negative";  
                } 
            }
            //neibor.push(copy.halfedgeSource(copy.halfedgePrev(ah)))
        }        
        var nl=neibor.length;
        //console.log(neibor);
        //console.log("valence ", i, nl);  
        for(var j=0;j<nl;j++){
            L1.val[i*n+neibor[j]]=-1/nl;    
        }
        /*if(i<n-1){
            L0.val[i*n+i]=-1;
            L0.val[i*n+i+1]=1;
        }*/
    }
    //this.laplacian0=sparse(L0);
    this.laplacian1=sparse(L1);
    /*//compute original laplacian with L0
    for(var i=0;i<n;i++){
        v.val[3*i]=this.meshDS.positions[i].x;
        v.val[3*i+1]=this.meshDS.positions[i].y;
        v.val[3*i+2]=this.meshDS.positions[i].z;
        this.R.push(eye(3));
    }
    this.olaplacian0=mulspMatrixMatrix(this.laplacian0,v);
    this.olaplacian1=mulspMatrixMatrix(this.laplacian1,v);*/
}

pathToEdit.prototype.goLast=function(){
    for(var i=0;i<hemesh.positions.length;i++){
        hemesh.positions[i].copy(this.lastMeshPositions[i]);
    }
    var mesh = setup.scene.getObjectByName("mesh"); 
    var meshROI = setup.scene.getObjectByName("meshROI"); 
    if(mesh!=undefined) mesh.geometry.verticesNeedUpdate = true;
    meshROI.geometry.verticesNeedUpdate = true;
}
