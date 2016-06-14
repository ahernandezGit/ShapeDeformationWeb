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
    console.log("definindo submesh");
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
    this.lastMeshPositions=[];
    this.tableHash=[];
    this.tableHashCurve=[];
    this.stopGrow=false;
    this.flagStop=false;
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
    this.initialPosition=hemesh.positions[this.handle].clone();
    for(var i=0;i<hemesh.positions.length;i++){
        this.lastMeshPositions[i]=hemesh.positions[i].clone();
    }
    this.initializeMesh();
    //this.computeVertex();
    //this.updateROIradius();
  
    //console.log(this.whatcurve);
    //console.log(this.boundary);
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
        
        //this.rendermesh();
        console.log("update render submesh");
        this.flagStop=false;
        //render();
    }
    else{
        setTimeout(this.updateRender,500);
        console.log("waiting render submesh");
        console.log(flaglabx,flaglaby,flaglabz);
    }
}
pathToEdit.prototype.initializeMesh=function(){
    // relation between index in hemesh positions and index in mesDs positions
    this.tableHash=[];
    this.tableHash[this.handle.toString()]=0;
    this.newfaces=[];
    this.meshDS=new Hemesh(); 
    this.meshDS.addVertex(hemesh.positions[this.handle]);
    this.laplacian0={};
    this.laplacian1={};
    var h=hemesh.vertexHalfedge(this.handle);
    var vertexs=this.boundary;
    hemesh.vertexCirculator(function(he){
            var vxt=hemesh.halfedgeSource(he);
            var pv=hemesh.positions[vxt];
            vertexs.push(vxt);
    },h);
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
pathToEdit.prototype.updateROIradius=function(){
    var vector = new THREE.Vector3();
    vector.set( mouse.x ,mouse.y , 0.5 );
    vector.unproject( setup.camera);
    var cameraposition=setup.camera.position.clone();
    var dir = vector.sub(cameraposition).normalize();
    var t=plane.point.clone().sub(cameraposition).dot(plane.normal)/dir.dot(plane.normal);
    var point=cameraposition.add(dir.multiplyScalar(t));
    var v=this.initialPosition;
    this.radius=point.clone().distanceTo(v);
    //console.log(this.radius);
    this.meshDS.positions[0].set(point.x,point.y,point.z);
    console.log(this.flagStop);
 
    
    this.computeVertex();
    
}
pathToEdit.prototype.computeVertex=function(){
        this.flagStop=true;
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
            //console.log(this.whatcurve);
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
        console.log("comp vertex");
        this.geodesiclength=totaldistance;
        this.js=js;
        this.jp=jp;
    if(level>this.level){ 
            this.level=level;
            //this.initializeMesh();
            if(this.level==1){       
                   var h=hemesh.vertexHalfedge(this.handle);     
                   var vertices=[];
                   var faces=[];
                   var tableHash=this.tableHash;
                   var k=1;
                   hemesh.vertexCirculator(function(he){
                       var src=hemesh.halfedgeSource(he);
                       //vertices.push(hemesh.positions[src].clone());
                       vertices.push(hemesh.positions[src]);
                       faces.push(hemesh.halfedgeFace(he));
                       tableHash[src.toString()]=k;
                       k++;
                   },h); 
                   //var ff=[]; 
                   for(var i=0;i<vertices.length;i++){
                       this.meshDS.addVertex(vertices[i]);
                       //var fac=hemesh.faceVertices(faces[i]);
                       //ff.push([this.tableHash[fac[0].toString()],this.tableHash[fac[1].toString()],this.tableHash[fac[2].toString()]]);
                   } 
                //this.meshDS.addFaces(ff);
                this.totalfaces=this.totalfaces.concat(faces);
                //compute new boundary
                this.updateBoundary();
                console.log("level1");
                this.rendermesh();
                this.flagStop=false;
                console.log(this.flagStop);
            } 
            else{
                   console.log(this.level);
                   var k=this.meshDS.positions.length;
                   for(var i=0;i<this.boundary.length;i++){
                       //this.meshDS.addVertex(hemesh.positions[this.boundary[i]].clone());
                       this.meshDS.addVertex(hemesh.positions[this.boundary[i]]);
                       this.tableHash[this.boundary[i].toString()]=k;
                       k++;
                   }    
                   var faces= this.newfaces;
                   this.totalfaces=this.totalfaces.concat(faces);
            
                    //compute new boundary
                    this.updateBoundary();
                    this.rendermesh();
                    console.log("fora");
                var mesh=setup.scene.getObjectByName("mesh");
        var wireframeMesh=setup.scene.getObjectByName("wireframeMesh");
        
        //meshROI.geometry.verticesNeedUpdate = true;
        mesh.geometry.verticesNeedUpdate = true;
                    //this.computeDeforming2();
            }
            
            //this.updatelaplacians();
            //this.computeDeforming();
            //this.updateDeforming();
    }
}
pathToEdit.prototype.rendermesh=function (){
    var meshscene=setup.scene.getObjectByName("meshROI");
    if(meshscene!=undefined){
       setup.scene.remove(meshscene);       
       meshscene={};    
    }
    var ff=[]; 
    for(var i=0;i<this.totalfaces.length;i++){
       var facess=hemesh.faceVertices(this.totalfaces[i]);
       ff.push([this.tableHash[facess[0].toString()],this.tableHash[facess[1].toString()],this.tableHash[facess[2].toString()]]);
    }
    this.meshDS.addFaces(ff);
    //this.lastMeshPositions=this.meshDS.positions.slice();
    
    //console.log(ff);

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
pathToEdit.prototype.crossR=function(rx,ry,rz,R){
    var r=[[1, -rz / 2, ry / 2],[rz / 2, 1, -rx / 2],[-ry / 2, rx / 2, 1]];
    return mulMatrixMatrix(mat(r),R);
}
pathToEdit.prototype.getClosestOrthonormal=function(R){
    var svdR = svd(R, "full");
    return mulMatrixMatrix(svdR.U,transposeMatrix(svdR.V));
}
pathToEdit.prototype.updateDeforming=function(){
    //compute laplacian
    var n=this.meshDS.positions.length;
    var v=zeros(n,3);
    var b=zeros(n+3,3);
    var A=zeros(n+3,n);
    var ri = 0;
    var L1=this.laplacian1;
    for(var i=0;i<n;i++){
        v.val[3*i]=this.meshDS.positions[i].x;
        v.val[3*i+1]=this.meshDS.positions[i].y;
        v.val[3*i+2]=this.meshDS.positions[i].z;
        var s = L1.rows[i];
        var e = L1.rows[i+1];
        for ( var k=s; k < e; k++) {
            A.val[ri + L1.cols[k] ] = L1.val[k];
        }
        ri += n; 
    }
    // laplacian nx3
    var la=mulspMatrixMatrix(L1,v);
    for(var i=0;i<n;i++){
        b.val[3*i]=la.val[3*i];
        b.val[3*i+1]=la.val[3*i+1];
        b.val[3*i+2]=la.val[3*i+2];
    }
    // 100.0 for fixed vertices
    var web=10.0;    
    b.val[3*n]=web*hemesh.positions[FixedVertex[this.indexInCurve]].x;
    b.val[3*n+1]=web*hemesh.positions[FixedVertex[this.indexInCurve]].y;
    b.val[3*n+2]=web*hemesh.positions[FixedVertex[this.indexInCurve]].z;
    b.val[3*(n+1)]=web*hemesh.positions[FixedVertex[this.jp]].x;
    b.val[3*(n+1)+1]=web*hemesh.positions[FixedVertex[this.jp]].y;
    b.val[3*(n+1)+2]=web*hemesh.positions[FixedVertex[this.jp]].z;
    b.val[3*(n+2)]=web*hemesh.positions[FixedVertex[this.js]].x;
    b.val[3*(n+2)+1]=web*hemesh.positions[FixedVertex[this.js]].y;
    b.val[3*(n+2)+2]=web*hemesh.positions[FixedVertex[this.js]].z;
    // 100.0 for fixed vertices
        
    A.val[n*n+this.tableHash[this.handle.toString()]]=web;
    A.val[(n+1)*n+this.tableHash[FixedVertex[this.jp]]]=web;
    A.val[(n+2)*n+this.tableHash[FixedVertex[this.js]]]=web;
    
    
    var bx=getCols(b,[0]);
    var by=getCols(b,[1]);
    var bz=getCols(b,[2]);
    var spA=sparse(A);
    
    var labx = new Lalolab("laloxname",false,"libs/lalolib") ; 
    var laby = new Lalolab("laloyname",false,"libs/lalolib") ; 
    var labz = new Lalolab("lalozname",false,"libs/lalolib") ; 
    labx.load(spA, "spA");
    laby.load(spA, "spA");
    labz.load(spA, "spA");
    labx.load(bx, "bx");
    laby.load(by, "by");
    labz.load(bz, "bz");
    labx.exec("vx=spcgnr(spA,bx)");	
    laby.exec("vy=spcgnr(spA,by)");	
    labz.exec("vz=spcgnr(spA,bz)");
    var copy=this.meshDS;
    //var flabx=false;
    //var flaby=false;
    //var flaby=false;
    labx.getObject("vx", function ( result ) { // recover the value of a variable from the lab
          for (var i=0;i<n;i++){
              copy.positions[i].setX(result[i]);
          }
          //console.log(result[0]);
          flaglabx=true;
          //console.log(flaglabx);
          labx.close();
    });	
    laby.getObject("vy", function ( result ) { // recover the value of a variable from the lab
        for (var i=0;i<n;i++){
              copy.positions[i].setY(result[i]);
        }
        //console.log(result[0]);
        flaglaby=true;
        //console.log(flaglaby);
        laby.close();
    });
    labz.getObject("vz", function ( result ) { // recover the value of a variable from the lab
        for (var i=0;i<n;i++){
              copy.positions[i].setZ(result[i]);
        }
        //console.log(result[0]);
        flaglabz=true;
        //console.log(flaglabz);
        labz.close();
    });
    this.updateRender();
    console.log("update vertex finish");
    
}
pathToEdit.prototype.computeDeforming=function(){
    var n=this.meshDS.positions.length;
    var nl0=this.useL0 ? n-1: n-2;
    var nl0_R=this.useL0_R ? n-1: n-2;
    var nfixed=3;
    console.log("computing deforming");
    
    //A and b for compute Rotations . We use L0 for this
    var b=zeros(3*nl0+3*nl0_R+3*nfixed+6);
    var A=zeros(3*nl0+3*nl0_R+3*nfixed+6,3*n+3*n);
    if(this.useL0){
        for(var i = 0; i<nl0; i++){
            A.val[(i * 3 + 0)*A.n + (i + 0) * 3 + 0]=-1;
            A.val[(i * 3 + 0)*A.n + (i + 1) * 3 + 0]=1;
            A.val[(i * 3 + 0)*A.n + n * 3 + (i + 0) * 3 + 0]=0;
            A.val[(i * 3 + 0)*A.n + n * 3 + (i + 0) * 3 + 1]=-this.olaplacian0.val[3*i+2];
            A.val[(i * 3 + 0)*A.n + n * 3 + (i + 0) * 3 + 2]=this.olaplacian0.val[3*i+1];
            b[i * 3 + 0] = this.olaplacian0.val[3*i];
            
            A.val[(i * 3 + 1)*A.n + (i + 0) * 3 + 1]=-1;
            A.val[(i * 3 + 1)*A.n + (i + 1) * 3 + 1]=1;
            A.val[(i * 3 + 1)*A.n + n * 3 + (i + 0) * 3 + 0]=this.olaplacian0.val[3*i+2];
            A.val[(i * 3 + 1)*A.n + n * 3 + (i + 0) * 3 + 1]=0;
            A.val[(i * 3 + 1)*A.n + n * 3 + (i + 0) * 3 + 2]=-this.olaplacian0.val[3*i];
            b[i * 3 + 1] = this.olaplacian0.val[3*i+1];
            
            A.val[(i * 3 + 2)*A.n + (i + 0) * 3 + 2]=-1;
            A.val[(i * 3 + 2)*A.n + (i + 1) * 3 + 2]=1;
            A.val[(i * 3 + 2)*A.n + n * 3 + (i + 0) * 3 + 0]=-this.olaplacian0.val[3*i+1];
            A.val[(i * 3 + 2)*A.n + n * 3 + (i + 0) * 3 + 1]=this.olaplacian0.val[3*i];
            A.val[(i * 3 + 2)*A.n + n * 3 + (i + 0) * 3 + 2]=0;
            b[i * 3 + 2] = this.olaplacian0.val[3*i+2];
        }
    }
    if(!this.useL0_R){
        for(var i = 0; i < nl0_R; i++){
            A.val[(nl0*3 + i * 3 + 0)*A.n + n*3 + (i + 0) * 3 + 0]=-0.5*this.weight;
            A.val[(nl0*3 + i * 3 + 0)*A.n + n*3 + (i + 1) * 3 + 0]=this.weight;
            A.val[(nl0*3 + i * 3 + 0)*A.n + n*3 + (i + 2) * 3 + 0]=-0.5*this.weight;
            b[nl0*3 + i * 3 + 0]=0;
            
            A.val[(nl0*3 + i * 3 + 1)*A.n + n*3 + (i + 0) * 3 + 1]=-0.5*this.weight;
            A.val[(nl0*3 + i * 3 + 1)*A.n + n*3 + (i + 1) * 3 + 1]=this.weight;
            A.val[(nl0*3 + i * 3 + 1)*A.n + n*3 + (i + 2) * 3 + 1]=-0.5*this.weight;
            b[nl0*3 + i * 3 + 1]=0;
            
            A.val[(nl0*3 + i * 3 + 2)*A.n + n*3 + (i + 0) * 3 + 2]=-0.5*this.weight;
            A.val[(nl0*3 + i * 3 + 2)*A.n + n*3 + (i + 1) * 3 + 2]=this.weight;
            A.val[(nl0*3 + i * 3 + 2)*A.n + n*3 + (i + 2) * 3 + 2]=-0.5*this.weight;
            b[nl0*3 + i * 3 + 2]=0;
        }
    }
    var constrainsA=[this.tableHash[this.handle.toString()],this.tableHash[FixedVertex[this.jp]],this.tableHash[FixedVertex[this.js]]];
    var indexConstrain=[FixedVertex[this.indexInCurve],FixedVertex[this.jp],FixedVertex[this.js]];
    for(var i = 0; i < 3; i++){
            A.val[(nl0*3 + nl0_R*3+ 3*i + 0)*A.n + constrainsA[i]*3+0]=this.constrainWeight;
            A.val[(nl0*3 + nl0_R*3+ 3*i + 1)*A.n + constrainsA[i]*3+1]=this.constrainWeight;
            A.val[(nl0*3 + nl0_R*3+ 3*i + 2)*A.n + constrainsA[i]*3+2]=this.constrainWeight;
            b[nl0*3 + nl0_R*3+ 3*i + 0]=this.constrainWeight*hemesh.positions[indexConstrain[i]].x;
            b[nl0*3 + nl0_R*3+ 3*i + 1]=this.constrainWeight*hemesh.positions[indexConstrain[i]].y;
            b[nl0*3 + nl0_R*3+ 3*i + 2]=this.constrainWeight*hemesh.positions[indexConstrain[i]].z;
    }
    A.val[(nl0*3 + nl0_R*3+ 3*3 + 0)*A.n + n*3+0]=this.constrainWeight;
    A.val[(nl0*3 + nl0_R*3+ 3*3 + 1)*A.n + n*3+1]=this.constrainWeight;
    A.val[(nl0*3 + nl0_R*3+ 3*3 + 2)*A.n + n*3+2]=this.constrainWeight;
    b[nl0*3 + nl0_R*3+ 3*3 + 0]=0;
    b[nl0*3 + nl0_R*3+ 3*3 + 1]=0;
    b[nl0*3 + nl0_R*3+ 3*3 + 2]=0;
    A.val[(nl0*3 + nl0_R*3+ 3*3 + 3)*A.n + n*3+(n-1)*3+0]=this.constrainWeights;
    A.val[(nl0*3 + nl0_R*3+ 3*3 + 4)*A.n + n*3+(n-1)*3+1]=this.constrainWeight;
    A.val[(nl0*3 + nl0_R*3+ 3*3 + 5)*A.n + n*3+(n-1)*3+2]=this.constrainWeight;
    b[nl0*3 + nl0_R*3+ 3*3 + 3]=0;
    b[nl0*3 + nl0_R*3+ 3*3 + 4]=0;
    b[nl0*3 + nl0_R*3+ 3*3 + 5]=0;
    
    var spA=sparse(A);
    console.log("spA and b");
    console.log(spA);
    console.log(b);
    console.log("sparse A ready");
    console.log("b ready");
    //var vxyz_rxyz=[];
    /*
    for(var i = 0; i < 4; i++){
        //this.vxyz_rxyz = zeros(n * 3 + n * 3);
        console.log("iter "+i+"of 4");
        this.vxyz_rxyz = spcgnr(spA,b);
        console.log("vr ",this.vxyz_rxyz);
        this.updateR();
        console.log("updated R");
        this.updateb(b);
        console.log("updated b");        
    }
    // update vertex positions
    //Av and b for compute final vertex positions . We use L1 for this
    // only three constrains
    var bx=zeros(n+3);
    var by=zeros(n+3);
    var bz=zeros(n+3);
    var Av=zeros(n+3,n);
    console.log("creating bx by bz av");
    for(var i=0;i<n;i++){
        var l1 = mat([this.olaplacian1[3*i],this.olaplacian1[3*i+1],this.olaplacian1[3*i+2]]);
        var rotated_l1=mulMatrixVector(this.R[i],l1);
        bx[i]=rotated_l1[0];
        by[i]=rotated_l1[1];
        bz[i]=rotated_l1[2];
        var s = this.laplacian1.rows[i];
        var e = this.laplacian1.rows[i+1];
        for ( var k=s; k < e; k++) {
            Av.val[ri + this.laplacian1.cols[k] ] = this.laplacian1.val[k];
        }
        ri += n; 
    }
    for(var i=0;i<3;i++){
        Av.val[(n + i)*A.n + constrainsA[i]]=this.constrainWeight;
        bx[n+i]=this.constrainWeight*hemesh.positions[indexConstrain[i]].x;
        by[n+i]=this.constrainWeight*hemesh.positions[indexConstrain[i]].y;
        bz[n+i]=this.constrainWeight*hemesh.positions[indexConstrain[i]].z;
    }
    var spAv=sparse(Av);
    console.log("sparse bx by bz and av did ");
    var labx = new Lalolab("laloxname",false,"libs/lalolib") ; 
    var laby = new Lalolab("laloyname",false,"libs/lalolib") ; 
    var labz = new Lalolab("lalozname",false,"libs/lalolib") ; 
    labx.load(spAv, "spA");
    laby.load(spAv, "spA");
    labz.load(spAv, "spA");
    labx.load(bx, "bx");
    laby.load(by, "by");
    labz.load(bz, "bz");
    labx.exec("vx=spcgnr(spA,bx)");	
    laby.exec("vy=spcgnr(spA,by)");	
    labz.exec("vz=spcgnr(spA,bz)");
    var copy=this.meshDS;
    flaglabx=false;
    flaglaby=false;
    flaglaby=false;
    console.log("begin labs")    
    labx.getObject("vx", function ( result ) { // recover the value of a variable from the lab
          for (var i=0;i<n;i++){
              copy.positions[i].setX(result[i]);
          }
          //console.log(result[0]);
          flaglabx=true;
          //console.log(flaglabx);
          labx.close();
    });	
    laby.getObject("vy", function ( result ) { // recover the value of a variable from the lab
        for (var i=0;i<n;i++){
              copy.positions[i].setY(result[i]);
        }
        //console.log(result[0]);
        flaglaby=true;
        //console.log(flaglaby);
        laby.close();
    });
    labz.getObject("vz", function ( result ) { // recover the value of a variable from the lab
        for (var i=0;i<n;i++){
              copy.positions[i].setZ(result[i]);
        }
        //console.log(result[0]);
        flaglabz=true;
        //console.log(flaglabz);
        labz.close();
    });
    this.updateRender();*/
    console.log("update vertex finish");
    
}
pathToEdit.prototype.updateR=function(){
    var n=this.R.length;
    for(var i = 0; i < n; i++){
        var rx = this.vxyz_rxyz[this.IndexVertices.length * 3 + i * 3 + 0];
        var ry = this.vxyz_rxyz[this.IndexVertices.length * 3 + i * 3 + 1];
        var rz = this.vxyz_rxyz[this.IndexVertices.length * 3 + i * 3 + 2];
        this.R[i] = this.crossR(rx, ry, rz, this.R[i]);
        this.R[i] = this.getClosestOrthonormal(this.R[i]);
    }
    console.log("finist updateR");
}
pathToEdit.prototype.updateb=function(b){
    if(this.useL0){
        for(var i = 0; i < n-1; i++){
            var  r = this.R[i];
            var l0 = mat([this.olaplacian0[3*i],this.olaplacian0[3*i+1],this.olaplacian0[3*i+2]]);
            var nb=  mulMatrixVector(r,l0);
            b[i * 3 + 0] = nb[0];
            b[i * 3 + 1] = nb[1];
            b[i * 3 + 2] = nb[2];
        }
    }
}
pathToEdit.prototype.computeDeforming2= function(){
    //compute vertex of the curve to deform
    var n=0;
    var IndexVertices=[];
    //var tableHashSubmesh=[];
    var _vertices=[];
    var i=this.jp;
    while(i!=this.js && n<500){   
        if(i==ListOfCurves[this.whatcurve][1]+1){
            i=ListOfCurves[this.whatcurve][0];
        }
        var indexInSubmesh=this.tableHash[FixedVertex[i].toString()];
        IndexVertices.push(indexInSubmesh);
        _vertices.push(this.meshDS.positions[indexInSubmesh]);
       // tableHashSubmesh[indexInSubmesh.toString()]=n;
        n++;
        i++;
    }
    //IndexVertices.push(this.tableHash[FixedVertex[this.js].toString()]);
    _vertices.push(this.meshDS.positions[this.tableHash[FixedVertex[this.js].toString()]]);
    //tableHashSubmesh[this.tableHash[FixedVertex[this.js].toString()].toString()]=n;
    this.IndexVertices=IndexVertices;
    //this.tableHashCurve=tableHashSubmesh;
    console.log(this.IndexVertices);
    n++;
    console.log(n,IndexVertices.length);
    //computing edges of the curve to deform (index from _vertices)
    var edges=[];
    for(var i=0;i<n-1;i++){
        edges.push([i,i+1]);
    }
    this.edges=edges;
    console.log(this.edges);
    //computing fixed vertices (index in IndexVertices)
    //var fixedVertices=[];
    this.fixedVertices[0]=0;
    this.fixedVertices[1]=IndexVertices.length-1;
    this.fixedVertices[2]=IndexVertices.indexOf(this.tableHash[this.handle.toString()]);
    console.log(this.fixedVertices);
    //computing fixed edges
    var FixedEdges=[];
    FixedEdges[0]=edges[0];
    FixedEdges[1]=edges[edges.length-1];
    console.log(FixedEdges);
    
    //Defining one rotation for each edge
    this.R=[];
    for(var i=0;i<edges.length;i++){
        this.R.push(eye(3));
    }
    //Defining fixed rotations (index in FixedEdges) 
    var FixedRotation=[];
    FixedRotation[0]=0;
    FixedRotation[1]=edges.length-1;
    
    this.FixedRotation=FixedRotation;
    console.log(this.FixedRotation);
    
    //computing triplets of vertex for computing uniform laplacian 
    var VertexTriplets=[];
    var VertexTripletsIndexR=[];
    for(var i=0;i<IndexVertices.length-2;i++){
        VertexTriplets.push([i,i+1,i+2]);
    }
    console.log(VertexTriplets);
    for(var i = 0; i < VertexTriplets.length; i++){
        var v0 = _vertices[VertexTriplets[i][0]].clone();
        var v1 = _vertices[VertexTriplets[i][1]].clone();
        var v2 = _vertices[VertexTriplets[i][2]].clone();
        var mid= v0.clone().add(v2);
        mid.multiplyScalar(0.5);
        this.original_laplacians_L1.push(v1.sub(mid));
        VertexTripletsIndexR.push([i,i+1]);
    }
    console.log(VertexTripletsIndexR);
    
    //computing triplets of edges for compute difference of rotations 
    var EdgeTriplets=[];
    for(var i=0;i<edges.length-2;i++){
        EdgeTriplets.push([i,i+1,i+2]);
    }
    this.EdgeTriplets=EdgeTriplets;
    console.log(this.EdgeTriplets);
    
    //Working with L0 for compute rotations
    // defining as laplacians as edges
    // laplacian are consecutive diference 
    
    this.n_laplacians_P = edges.length;
    this.n_laplacians_R = EdgeTriplets.length;
    for(var i = 0; i < this.n_laplacians_P; i++){
        this.original_laplacians_P.push(_vertices[edges[i][1]].clone().sub(_vertices[edges[i][0]]));
    }
    console.log(this.original_laplacians_P);
    
    this.A=zeros(this.n_laplacians_P * 3 + this.n_laplacians_R * 9 + this.fixedVertices.length * 3 + this.FixedRotation.length * 3,this.IndexVertices.length * 3 + this.R.length * 3);
    this.b=zeros(this.n_laplacians_P * 3 + this.n_laplacians_R * 9 + this.fixedVertices.length * 3 + this.FixedRotation.length * 3);
    // computing rotations
    for(var i = 0; i < 2; i++){
        this.updateAB();
        this.solve();
        this.updateR();
    }
    
    //Working with L1 fpr computing vertex positions
    var A=zeros(VertexTriplets.length +this.fixedVertices.length,this.IndexVertices.length);
    var bx=zeros(VertexTriplets.length +this.fixedVertices.length);
    var by=zeros(VertexTriplets.length +this.fixedVertices.length);
    var bz=zeros(VertexTriplets.length +this.fixedVertices.length);
    for(var i = 0; i < VertexTriplets.length; i++){
           A.val[i*A.n+VertexTriplets[i][0]]=-0.5;
           A.val[i*A.n+VertexTriplets[i][1]]=1;
           A.val[i*A.n+VertexTriplets[i][2]]=-0.5;
    }
    for(var i = 0; i < this.fixedVertices.length; i++){
            var index = this.fixedVertices[i];
            A.val[(VertexTriplets.length+i)*A.n+index]=this.constrainWeight;
    }
    for(var i = 0; i < VertexTriplets.length; i++){
        var r0= this.R[VertexTripletsIndexR[i][0]];
        var r1= this.R[VertexTripletsIndexR[i][1]];
        var r = this.averageRotation(r0, r1);
        var l1=mat(this.original_laplacians_L1[i].toArray());
        var rotated_laplacian = mulMatrixVector(r,l1);
        bx[i] = rotated_laplacian[0];
        by[i] = rotated_laplacian[1];
        bz[i] = rotated_laplacian[2];
    }
    for(var i = 0; i < this.fixedVertices.length; i++){
        var index = this.fixedVertices[i];
        bx[VertexTriplets.length + i] = _vertices[index].x * this.constrainWeight;
        by[VertexTriplets.length + i] = _vertices[index].y * this.constrainWeight;
        bz[VertexTriplets.length + i] = _vertices[index].z * this.constrainWeight;;
    }
    var spA=sparse(A);
    var labx = new Lalolab("laloxname",false,"libs/lalolib") ; 
    var laby = new Lalolab("laloyname",false,"libs/lalolib") ; 
    var labz = new Lalolab("lalozname",false,"libs/lalolib") ; 
    labx.load(spA, "spA");
    laby.load(spA, "spA");
    labz.load(spA, "spA");
    labx.load(bx, "bx");
    laby.load(by, "by");
    labz.load(bz, "bz");
    labx.exec("vx=spcgnr(spA,bx)");	
    laby.exec("vy=spcgnr(spA,by)");	
    labz.exec("vz=spcgnr(spA,bz)");
    var copyn=this.IndexVertices.length;
    flaglabx=false;
    flaglaby=false;
    flaglaby=false;
    console.log("begin labs")    
    labx.getObject("vx", function ( result ) { // recover the value of a variable from the lab
          for (var i=0;i<copyn;i++){
              _vertices[i].setX(result[i]);   
          }
          //console.log(result[0]);
          flaglabx=true;
          //console.log(flaglabx);
          labx.close();
    });	
    laby.getObject("vy", function ( result ) { // recover the value of a variable from the lab
        for (var i=0;i<copyn;i++){
              _vertices[i].setY(result[i]);
        }
        //console.log(result[0]);
        flaglaby=true;
        //console.log(flaglaby);
        laby.close();
    });
    labz.getObject("vz", function ( result ) { // recover the value of a variable from the lab
        for (var i=0;i<copyn;i++){
              _vertices[i].setZ(result[i]);
        }
        //console.log(result[0]);
        flaglabz=true;
        //console.log(flaglabz);
        labz.close();
    });
    
    this.updateRender();
}
pathToEdit.prototype.updateAB=function(){
    var col=this.A.n;
    for(var i = 0; i < this.n_laplacians_P; i++){
            var r=this.R[i];
            var l0vector = this.original_laplacians_P[i];
            var l0=l0vector.toArray();
            l0=mulMatrixVector(r,mat(l0));
            var edge = this.edges[i];
            var v0 = edge[0];
            var v1 = edge[1];
            this.A.val[(i * 3 + 0)*col+ v0 * 3 + 0] = -1;
            this.A.val[(i * 3 + 0)*col+ v1 * 3 + 0] = 1;
            this.A.val[(i * 3 + 0)*col+this.IndexVertices.length * 3 + (i + 0) * 3 + 0] = 0;
            this.A.val[(i * 3 + 0)*col+this.IndexVertices.length * 3 + (i + 0) * 3 + 1] = -l0[2];
            this.A.val[(i * 3 + 0)*col+this.IndexVertices.length * 3 + (i + 0) * 3 + 2] = l0[1];
            this.b[i * 3 + 0] = l0[0];
            this.A.val[(i * 3 + 1)*col+v0 * 3 + 1] = -1;
            this.A.val[(i * 3 + 1)*col+v1 * 3 + 1] = 1;
            this.A.val[(i * 3 + 1)*col+this.IndexVertices.length * 3 + (i + 0) * 3 + 0] = l0[2];
            this.A.val[(i * 3 + 1)*col+this.IndexVertices.length * 3 + (i + 0) * 3 + 1] = 0;
            this.A.val[(i * 3 + 1)*col+this.IndexVertices.length * 3 + (i + 0) * 3 + 2] = -l0[0];
            this.b[i * 3 + 1] = l0[1];
            this.A.val[(i * 3 + 2)*col+v0 * 3 + 2] = -1;
            this.A.val[(i * 3 + 2)*col+v1 * 3 + 2] = 1;
            this.A.val[(i * 3 + 2)*col+this.IndexVertices.length * 3 + (i + 0) * 3 + 0] = -l0[1];
            this.A.val[(i * 3 + 2)*col+this.IndexVertices.length * 3 + (i + 0) * 3 + 1] = l0[0];
            this.A.val[(i * 3 + 2)*col+this.IndexVertices.length * 3 + (i + 0) * 3 + 2] = 0;
            this.b[i * 3 + 2] = l0[2];
    }
    for(var i = 0; i < this.n_laplacians_R; i++){
            var e0 = this.EdgeTriplets[i][0];
            var e1 = this.EdgeTriplets[i][1];
            var e2 = this.EdgeTriplets[i][2];
            for(var j = 0; j < 3; j++){
                this.A.val[(this.n_laplacians_P * 3 + i * 9 + j)*col+this.IndexVertices.length * 3 + e0 * 3 + 0] = 0;
                this.A.val[(this.n_laplacians_P * 3 + i * 9 + j)*col+this.IndexVertices.length * 3 + e0 * 3 + 1] = this.weight * -0.5 * this.R[e0].val[2*3+j];
                this.A.val[(this.n_laplacians_P * 3 + i * 9 + j)*col+this.IndexVertices.length * 3 + e0 * 3 + 2] = this.weight * -0.5 * -this.R[e0].val[1*3+j];
                this.A.val[(this.n_laplacians_P * 3 + i * 9 + j)*col+this.IndexVertices.length * 3 + e1 * 3 + 0] = 0;
                this.A.val[(this.n_laplacians_P * 3 + i * 9 + j)*col+this.IndexVertices.length * 3 + e1 * 3 + 1] = this.weight * 1 * this.R[e1].val[2*3+j];
                this.A.val[(this.n_laplacians_P * 3 + i * 9 + j)*col+this.IndexVertices.length * 3 + e1 * 3 + 2] = this.weight * 1 * -this.R[e1].val[1*3+j];
                this.A.val[(this.n_laplacians_P * 3 + i * 9 + j)*col+this.IndexVertices.length * 3 + e2 * 3 + 0] = 0;
                this.A.val[(this.n_laplacians_P * 3 + i * 9 + j)*col+this.IndexVertices.length * 3 + e2 * 3 + 1] = this.weight * -0.5 * this.R[e2].val[2*3+j];
                this.A.val[(this.n_laplacians_P * 3 + i * 9 + j)*col+this.IndexVertices.length * 3 + e2 * 3 + 2] = this.weight * -0.5 * -this.R[e2].val[1*3+j];
                this.b[this.n_laplacians_P * 3 + i * 9 + j] = this.weight * ((0.5 * this.R[e0].val[0*3+j] - 1 * this.R[e1].val[0*3+j]) + 0.5 * this.R[e2].val[0*3+j]);
                this.A.val[(this.n_laplacians_P * 3 + i * 9 + 3 + j)*col+this.IndexVertices.length * 3 + e0 * 3 + 0] = this.weight * -0.5 * -this.R[e0].val[2*3+j];
                this.A.val[(this.n_laplacians_P * 3 + i * 9 + 3 + j)*col+this.IndexVertices.length * 3 + e0 * 3 + 1] = 0;
                this.A.val[(this.n_laplacians_P * 3 + i * 9 + 3 + j)*col+this.IndexVertices.length * 3 + e0 * 3 + 2] = this.weight * -0.5 * this.R[e0].val[0*3+j];
                this.A.val[(this.n_laplacians_P * 3 + i * 9 + 3 + j)*col+this.IndexVertices.length * 3 + e1 * 3 + 0] = this.weight * 1 * -this.R[e1].val[2*3+j];
                this.A.val[(this.n_laplacians_P * 3 + i * 9 + 3 + j)*col+this.IndexVertices.length * 3 + e1 * 3 + 1] = 0;
                this.A.val[(this.n_laplacians_P * 3 + i * 9 + 3 + j)*col+this.IndexVertices.length * 3 + e1 * 3 + 2] = this.weight * 1 * this.R[e1].val[0*3+j];
                this.A.val[(this.n_laplacians_P * 3 + i * 9 + 3 + j)*col+this.IndexVertices.length * 3 + e2 * 3 + 0] = this.weight * -0.5 * -this.R[e2].val[2*3+j];
                this.A.val[(this.n_laplacians_P * 3 + i * 9 + 3 + j)*col+this.IndexVertices.length * 3 + e2 * 3 + 1] = 0;
                this.A.val[(this.n_laplacians_P * 3 + i * 9 + 3 + j)*col+this.IndexVertices.length * 3 + e2 * 3 + 2] = this.weight * -0.5 * this.R[e2].val[0*3+j];
                this.b[this.n_laplacians_P * 3 + i * 9 + 3 + j] = this.weight * ((0.5 * this.R[e0].val[1*3+j] - 1* this.R[e1].val[1*3+j]) + 0.5 * this.R[e2].val[1*3+j]);
                this.A.val[(this.n_laplacians_P * 3 + i * 9 + 6 + j)*col+this.IndexVertices.length * 3 + e0 * 3 + 0] = this.weight * -0.5 * this.R[e0].val[1*3+j];
                this.A.val[(this.n_laplacians_P * 3 + i * 9 + 6 + j)*col+this.IndexVertices.length * 3 + e0 * 3 + 1] = this.weight * -0.5 * -this.R[e0].val[0*3+j];
                this.A.val[(this.n_laplacians_P * 3 + i * 9 + 6 + j)*col+this.IndexVertices.length * 3 + e0 * 3 + 2] = 0;
                this.A.val[(this.n_laplacians_P * 3 + i * 9 + 6 + j)*col+this.IndexVertices.length * 3 + e1 * 3 + 0] = this.weight * 1 * this.R[e1].val[1*3+j];
                this.A.val[(this.n_laplacians_P * 3 + i * 9 + 6 + j)*col+this.IndexVertices.length * 3 + e1 * 3 + 1] = this.weight * 1 * -this.R[e1].val[0*3+j];
                this.A.val[(this.n_laplacians_P * 3 + i * 9 + 6 + j)*col+this.IndexVertices.length * 3 + e1 * 3 + 2] = 0
                this.A.val[(this.n_laplacians_P * 3 + i * 9 + 6 + j)*col+this.IndexVertices.length * 3 + e2 * 3 + 0] = this.weight * -0.5 * this.R[e2].val[1*3+j];
                this.A.val[(this.n_laplacians_P * 3 + i * 9 + 6 + j)*col+this.IndexVertices.length * 3 + e2 * 3 + 1] = this.weight * -0.5 * -this.R[e2].val[0*3+j];
                this.A.val[(this.n_laplacians_P * 3 + i * 9 + 6 + j)*col+this.IndexVertices.length * 3 + e2 * 3 + 2] = 0;
                this.b[this.n_laplacians_P * 3 + i * 9 + 6 + j] = this.weight * ((0.5 * this.R[e0].val[2*3+j] - 1 * this.R[e1].val[2*3+j]) + 0.5 * this.R[e2].val[2*3+j]);
            }

    }
    for(var i = 0; i < this.fixedVertices.length; i++){
            var index = this.fixedVertices[i];
            this.A.val[(this.n_laplacians_P * 3 +  this.n_laplacians_R * 9 + 3 * i + 0)*col+index * 3 + 0] = this.constrainWeight;
            this.A.val[(this.n_laplacians_P * 3 +  this.n_laplacians_R * 9 + 3 * i + 1)*col+index * 3 + 1] = this.constrainWeight;
            this.A.val[(this.n_laplacians_P * 3 +  this.n_laplacians_R * 9 + 3 * i + 2)*col+index * 3 + 2] = this.constrainWeight;
            this.b[this.n_laplacians_P * 3 +  this.n_laplacians_R * 9 +  3 * i + 0] = this.constrainWeight * this.meshDS.positions[this.IndexVertices[index]].x;
            this.b[this.n_laplacians_P * 3 +  this.n_laplacians_R * 9 +  3 * i + 1] = this.constrainWeight * this.meshDS.positions[this.IndexVertices[index]].y;
            this.b[this.n_laplacians_P * 3 +  this.n_laplacians_R * 9 +  3 * i + 2] = this.constrainWeight * this.meshDS.positions[this.IndexVertices[index]].z;
    }

    for(var i = 0; i < this.FixedRotation.length; i++){
            var index = this.FixedRotation[i];
            this.A.val[(this.n_laplacians_P * 3 + this.n_laplacians_R * 9 + this.fixedVertices.length * 3 + i * 3 + 0)*col+this.IndexVertices.length * 3 + index * 3 + 0] = this.constrainWeight;
            this.A.val[(this.n_laplacians_P * 3 + this.n_laplacians_R * 9 + this.fixedVertices.length * 3 + i * 3 + 1)*col+this.IndexVertices.length * 3 + index * 3 + 1] = this.constrainWeight;
            this.A.val[(this.n_laplacians_P * 3 + this.n_laplacians_R * 9 + this.fixedVertices.length * 3 + i * 3 + 2)*col+this.IndexVertices.length * 3 + index * 3 + 2] = this.constrainWeight;
            this.b[this.n_laplacians_P * 3 + this.n_laplacians_R * 9 + this.fixedVertices.length * 3 + i * 3 + 0] = 0;
            this.b[this.n_laplacians_P * 3 + this.n_laplacians_R * 9 + this.fixedVertices.length * 3 + i * 3 + 1] = 0;
            this.b[this.n_laplacians_P * 3 + this.n_laplacians_R * 9 + this.fixedVertices.length * 3 + i * 3 + 2] = 0;
    }
    console.log("finist updateAB");
}
pathToEdit.prototype.solve=function(){
    var spA=sparse(this.A);
    this.vxyz_rxyz=spcgnr(spA,this.b);
    console.log("finist solve");
}
pathToEdit.prototype.averageRotation=function(r0,r1){
    var r = zeros(3,3);
    for(var x = 0; x < 3; x++){
        for(var y = 0; y < 3; y++){
            r.val[x*r.n+y] = (r0.val[x*r0.n+y] + r1.val[x*r1.n+y]) / 2;
        }
        var length = Math.sqrt(r.val[x*r.n+0] * r.val[x*r.n+0] + r.val[x*r.n+1] * r.val[x*r.n+1] + r.val[x*r.n+2] * r.val[x*r.n+2]);
        for(var y = 0; y < 3; y++){
            r.val[x*r.n+y] /= length;
        }
    }
    return r;
}
pathToEdit.prototype.computeDeforming3= function(){
    //compute vertex of the curve to deform
    var n=0;
    var IndexVertices=[];
    //var tableHashSubmesh=[];
    var _vertices=[];
    var i=this.jp;
    while(i!=this.js && n<500){   
        if(i==ListOfCurves[this.whatcurve][1]+1){
            i=ListOfCurves[this.whatcurve][0];
        }
        var indexInSubmesh=this.tableHash[FixedVertex[i].toString()];
        IndexVertices.push(indexInSubmesh);
        _vertices.push(this.meshDS.positions[indexInSubmesh]);
       // tableHashSubmesh[indexInSubmesh.toString()]=n;
        n++;
        i++;
    }
    //IndexVertices.push(this.tableHash[FixedVertex[this.js].toString()]);
    _vertices.push(this.meshDS.positions[this.tableHash[FixedVertex[this.js].toString()]]);
    //tableHashSubmesh[this.tableHash[FixedVertex[this.js].toString()].toString()]=n;
    this.IndexVertices=IndexVertices;
    //this.tableHashCurve=tableHashSubmesh;
    console.log(this.IndexVertices);
    n++;
    
}