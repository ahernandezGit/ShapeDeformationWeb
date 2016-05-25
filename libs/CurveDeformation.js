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
    this.weight=0.1;
    this.constrainWeight=100;
    this.olaplacian0=[];
    this.olaplacian1=[];
    this.R=[];
    this.radius=r;
    this.fixed=[];
    this.boundary=[];
    this.handle=v;
    this.whatcurve=c;
    this.indexInCurve=ci;
    this.level=0;
    this.js=this.indexInCurve;
    this.jp=this.indexInCurve;
    this.geodesiclength=0;
    this.totalfaces=[];
    this.initialPosition=hemesh.positions[v].clone();
    // flags for render;
    this.flabx=false;
    this.flaby=false;
    this.flabz=false;
    this.initializeMesh();
    //console.log(this.boundary);
}
pathToEdit.prototype.updateRender=function(){
    if(flaglabx && flaglaby && flaglabz){
        var mesh=setup.scene.getObjectByName("mesh");

        var wireframe=setup.scene.getObjectByName("wireframe");

        mesh.geometry.verticesNeedUpdate = true;
        ListOfCurvesObject[this.whatcurve].geometry.verticesNeedUpdate = true;
        setup.scene.remove(wireframe);
        wireframeLines = hemesh.toWireframeGeometry();
        var wireframe = new THREE.LineSegments(wireframeLines, new THREE.LineBasicMaterial({
            color: 0xff2222,
            opacity: 0.2,
            transparent: true,
        }));
        wireframe.name="wireframe";
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
pathToEdit.prototype.computeVertex=function (){
        var le=2.5*this.radius;
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
        console.log("le",le);
        console.log(totaldistance);
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
                       vertices.push(hemesh.positions[src].clone());
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
            } 
            else {
                   console.log(this.level);
                   var k=this.meshDS.positions.length;
                   for(var i=0;i<this.boundary.length;i++){
                       this.meshDS.addVertex(hemesh.positions[this.boundary[i]].clone());
                       this.tableHash[this.boundary[i].toString()]=k;
                       k++;
                   }    
                   var faces= this.newfaces;
                   this.totalfaces=this.totalfaces.concat(faces);
            
                    //compute new boundary
                    this.updateBoundary();
                    
                    console.log("fora");
            }
               
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
                //console.log(ff);
                
                meshscene=new THREE.Mesh(this.meshDS.toGeometry(), new THREE.MeshBasicMaterial({
                    color: 0xE8D120,
                    side:  THREE.DoubleSide
                }));
                meshscene.name="meshROI";
                setup.scene.add(meshscene);
                var pointGeometry = new THREE.Geometry();
                for(var i=0;i<this.boundary.length;i++){
                    pointGeometry.vertices.push(hemesh.positions[this.boundary[i]].clone());    
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
                this.updatelaplacians();
                this.computeDeforming();
                //this.updateDeforming();
            }
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
    hemesh.positions[this.handle].set(point.x,point.y,point.z);
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
    var L0=zeros(n-1,n);
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
        if(i<n-1){
            L0.val[i*n+i]=-1;
            L0.val[i*n+i+1]=1;
        }
    }
    this.laplacian0=sparse(L0);
    this.laplacian1=sparse(L1);
    //compute original laplacian with L0
    for(var i=0;i<n;i++){
        v.val[3*i]=this.meshDS.positions[i].x;
        v.val[3*i+1]=this.meshDS.positions[i].y;
        v.val[3*i+2]=this.meshDS.positions[i].z;
        this.R.push(eye(3));
    }
    this.olaplacian0=mulspMatrixMatrix(this.laplacian0,v);
    this.olaplacian1=mulspMatrixMatrix(this.laplacian1,v);
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
    var nl0_R=this.useL0 ? n-1: n-2;
    var nfixed=3;
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
            b[i * 3 + 0] = olaplacian0.val[3*i];
            
            A.val[(i * 3 + 1)*A.n + (i + 0) * 3 + 1]=-1;
            A.val[(i * 3 + 1)*A.n + (i + 1) * 3 + 1]=1;
            A.val[(i * 3 + 1)*A.n + n * 3 + (i + 0) * 3 + 0]=this.olaplacian0.val[3*i+2];
            A.val[(i * 3 + 1)*A.n + n * 3 + (i + 0) * 3 + 1]=0;
            A.val[(i * 3 + 1)*A.n + n * 3 + (i + 0) * 3 + 2]=-this.olaplacian0.val[3*i];
            b[i * 3 + 1] = olaplacian0.val[3*i+1];
            
            A.val[(i * 3 + 2)*A.n + (i + 0) * 3 + 2]=-1;
            A.val[(i * 3 + 2)*A.n + (i + 1) * 3 + 2]=1;
            A.val[(i * 3 + 2)*A.n + n * 3 + (i + 0) * 3 + 0]=-this.olaplacian0.val[3*i+1];
            A.val[(i * 3 + 2)*A.n + n * 3 + (i + 0) * 3 + 1]=this.olaplacian0.val[3*i];
            A.val[(i * 3 + 2)*A.n + n * 3 + (i + 0) * 3 + 2]=0;
            b[i * 3 + 2] = olaplacian0.val[3*i+2];
        }solve
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
    for(int i = 0; i < 4; i++){
        //this.vxyz_rxyz = zeros(n * 3 + n * 3);
        this.vxyz_rxyz = spcgnr(spA,b);
        this.updateR();
        this.updateb(b);
    }
    // update vertex positions
    //Av and b for compute final vertex positions . We use L1 for this
    // only three constrains
    var bx=zeros(n+3);
    var by=zeros(n+3);
    var bz=zeros(n+3);
    var Av=zeros(n+3,n);
    var ri = 0;
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
    var spAv=sparse(A);
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
pathToEdit.prototype.updateR=function(){
    var n=this.meshDS.positions.length;
    for(var i = 0; i < n; i++){
        var rx = this.vxyz_rxyz[n * 3 + i * 3 + 0];
        var ry = this.vxyz_rxyz[n * 3 + i * 3 + 1];
        var rz = this.vxyz_rxyz[n * 3 + i * 3 + 2];
        this.R[i] = this.crossR(rx, ry, rz, this.R[i]);
        this.R[i] = this.getClosestOrthonormal(this.R[i]);
    }
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
