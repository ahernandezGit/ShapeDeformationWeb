// two index in FixedVErtex that store the begining and end of wich curve 
var ListOfCurves=[];
var ListOfCurvesGeometry=[];
var ListOfCurvesObject=[];
function planeToDeforming(normal,x,y,z,v){
    this.normal=new THREE.Vector3(normal.x,normal.y,normal.z);
    this.point=new THREE.Vector3(x,y,z);
    this.indexp=v;
}

//center: index in curveVertices array
//wc: index of the curve in ListOfCurves array
function curveSymmetricSegment(center,curveVertices,wc){
    this.center=center;
    this.radius=0;
    this.geodesiclength=0;
    this.level=0;
    this.js=center;
    this.jp=center;
    this.initialPosition=curveVertices[center].clone();
    this.whatcurve=wc;
    this.arrayVertices=[center];
    this.curveVertices=curveVertices;
    this.curveVerticesOriginal=[];
    for(var i=0;i<curveVertices.length;i++){
        this.curveVerticesOriginal.push(curveVertices[i].clone());
    }
    this.doDeform={};
    this.lastarray=[];
    for(var i=0;i<hemesh.positions.length;i++){
        this.lastarray.push(hemesh.positions[i].clone());
    }
    this.OXLaplacian=zeros(hemesh.positions.length);
    this.OYLaplacian=zeros(hemesh.positions.length);
    this.OZLaplacian=zeros(hemesh.positions.length);
    for(var i=0;i<hemesh.positions.length;i++){
        this.OXLaplacian[i]=this.lastarray[i].x;
        this.OYLaplacian[i]=this.lastarray[i].y;
        this.OZLaplacian[i]=this.lastarray[i].z;
    }
    this.OXLaplacian=mulspMatrixVector(L,this.OXLaplacian);
    this.OYLaplacian=mulspMatrixVector(L,this.OYLaplacian);
    this.OZLaplacian=mulspMatrixVector(L,this.OZLaplacian);
    //this.updateRadius;
    //this.computeLevel;
}
curveSymmetricSegment.prototype.computeLevel=function (){
    var le=5*this.radius;
    var js=this.center;
    var jp=this.center;
    var level=0; 
    var totaldistance=0;
    var s=this.curveVertices.length;
    var arrayVertices=[this.center];
    while(true){   
        var js0=js;
        var jp0=jp;
        js=(js+1)%s;
        jp=(jp-1+s)%s;
        var pjs=this.curveVertices[js];
        var pjp=this.curveVertices[jp];
        var pjs0=this.curveVertices[js0];
        var pjp0=this.curveVertices[jp0];
        totaldistance+=pjs.distanceTo(pjs0)+pjp.distanceTo(pjp0);
        if(totaldistance<le){
            level++;
            arrayVertices.push(js);
            arrayVertices.unshift(jp);
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
    this.arrayVertices=arrayVertices;
    this.js=js;
    this.jp=jp;
    if(level>1){
        if(level>this.level && level<this.curveVerticesOriginal.length/4){
           for(var i=0;i<this.curveVertices.length;i++){
               this.curveVertices[i].copy(this.curveVerticesOriginal[i]);
           }
           this.doDeform=new deformed3(this.arrayVertices,this.center,this.curveVertices,ListOfCurvesObject[this.whatcurve]);
           this.level=level;  
           console.log(level);     
           //console.log(this.arrayVertices);
        }
        else{
           this.doDeform.updateVertices3();    
        }
    }
}
curveSymmetricSegment.prototype.setFixedROI=function (le){
    var js=this.center;
    var jp=this.center;
    var level=0; 
    var s=this.curveVertices.length;
    var arrayVertices=[this.center];
    while(level<le){   
        var js0=js;
        var jp0=jp;
        js=(js+1)%s;
        jp=(jp-1+s)%s;
        var pjs=this.curveVertices[js];
        var pjp=this.curveVertices[jp];
        var pjs0=this.curveVertices[js0];
        var pjp0=this.curveVertices[jp0];
        level++;
        arrayVertices.push(js);
        arrayVertices.unshift(jp);
    }
    this.arrayVertices=arrayVertices;
    this.js=js;
    this.jp=jp;
    this.doDeform=new deformed3(this.arrayVertices,this.center,this.curveVertices,ListOfCurvesObject[this.whatcurve]);
    this.level=level;  
}
curveSymmetricSegment.prototype.updateRadius=function(){
    var vector = new THREE.Vector3();
    vector.set( mouse.x ,mouse.y , 0.5 );
    vector.unproject( setup.camera);
    var cameraposition=setup.camera.position.clone();
    var dir = vector.sub(cameraposition).normalize();
    var t=plane.point.clone().sub(cameraposition).dot(plane.normal)/dir.dot(plane.normal);
    var point=cameraposition.add(dir.multiplyScalar(t));
    this.radius=point.clone().distanceTo(this.initialPosition);
    if(this.level>2) this.curveVertices[this.center].set(point.x,point.y,point.z);
    if(!checkMeshROI.checked)  this.computeLevel();
}
curveSymmetricSegment.prototype.goLast=function(){
    for(i=0;i<hemesh.positions.length;i++){
        hemesh.positions[i].copy(this.lastarray[i]);
    }
    var mesh = setup.scene.getObjectByName("mesh"); 
    ListOfCurvesObject[this.whatcurve].geometry.verticesNeedUpdate = true;   
    if(mesh!=undefined) mesh.geometry.verticesNeedUpdate = true;   
    var wireframe=setup.scene.getObjectByName("wireframeMesh");
    setup.scene.remove(wireframe);
    wireframeLines = hemesh.toWireframeGeometry();
    var wireframe = new THREE.LineSegments(wireframeLines, new THREE.LineBasicMaterial({
        color: 0xff2222,
        opacity: 0.2,
        transparent: true,
    }));
    wireframe.name="wireframeMesh";
    setup.scene.add(wireframe);
}
curveSymmetricSegment.prototype.updatePositions=function(){
    var n=L.n;
    //var fL=full(L);
    var el=computeAverageEdgeLength();
    var etaarray=computeEdgeVector(el);
    var m=etaarray.length;
    var r=FixedVertex.length;
    var A=zeros(n+r+m,n);
    var b=zeros(n+r+m,3);
    var ri = 0;
    for(var i=0;i<n;i++){
        var s = L.rows[i];
        var e = L.rows[i+1];
        for ( var k=s; k < e; k++) {
            A.val[ri + L.cols[k] ] = L.val[k];
        }
        ri += n; 
        b.val[3*i]=this.OXLaplacian[i];
        b.val[3*i+1]=this.OYLaplacian[i];
        b.val[3*i+2]=this.OZLaplacian[i];
    }
    var web=100.0;
    for(var i=n;i<n+r;i++){
        // 100.0 for fixed vertices
        b.val[3*i]=web*hemesh.positions[FixedVertex[i-n]].x;
        b.val[3*i+1]=web*hemesh.positions[FixedVertex[i-n]].y;
        b.val[3*i+2]=web*hemesh.positions[FixedVertex[i-n]].z;
        
        // 100.0 for fixed vertices
        
        A.val[i*A.n+FixedVertex[i-n]]=web;
        
    }
     // 0.01 for vertices in the B subset
    var wel=0.01;
    for(var i=n+r;i<n+r+m;i++){
        b.val[3*i]=wel*etaarray[i-n-r].vector.x;
        b.val[3*i+1]=wel*etaarray[i-n-r].vector.y;
        b.val[3*i+2]=wel*etaarray[i-n-r].vector.z;
        A.val[i*A.n+etaarray[i-n-r].i]=wel;
        A.val[i*A.n+etaarray[i-n-r].j]=-wel;
    }
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
    
    flaglabx=false;
    flaglaby=false;
    flaglabz=false;
    labx.getObject("vx", function ( result ) { // recover the value of a variable from the lab
          for (var i=0;i<n;i++){
              hemesh.positions[i].setX(result[i]);
          }
          //console.log(result[0]);
          flaglabx=true;
          //console.log(flaglabx);
          labx.close();
    });	
    laby.getObject("vy", function ( result ) { // recover the value of a variable from the lab
        for (var i=0;i<n;i++){
              hemesh.positions[i].setY(result[i]);
        }
        //console.log(result[0]);
        flaglaby=true;
        //console.log(flaglaby);
        laby.close();
    });
    labz.getObject("vz", function ( result ) { // recover the value of a variable from the lab
        for (var i=0;i<n;i++){
              hemesh.positions[i].setZ(result[i]);
        }
        //console.log(result[0]);
        flaglabz=true;
        //console.log(flaglabz);
        labz.close();
    });
    console.log("update positions finish");
}

function deformed3(array,handle,curveVertex,curveObject){
    this.indexvertices=array;
    this.handle=handle;
    this.tableHash=[];
    this.n=array.length;
    if(this.n>=1) this.extremes=[array[0],array[this.n-1]];
    else this.extremes=[];
    this.olaplacian=[];
    this.freeVertex=[];
    this.pxy=[];
    this.weight=100;
    this.lowweight=1;
    //this.lastarray=[];
    this.curveVertex=curveVertex;
    this.curveObject=curveObject;
    if(this.n>0) this.initialize();
}
deformed3.prototype.initialize=function (){
    var positions=[];
    for(var i=0;i<this.n;i++){
        positions.push(this.curveVertex[this.indexvertices[i]]);
        this.tableHash[this.indexvertices[i].toString()]=i;
    }
   /* for(var i=0;i<hemesh.positions.length;i++){
        this.lastarray.push(hemesh.positions[i].clone());
    }*/
    this.positions=positions;
    this.computeLaplacian();
}
deformed3.prototype.computeOriginalValues=function (){
    var pxyz=[];
    for(var i=0;i<this.n;i++){
        pxyz.push(this.positions[i].x);
        pxyz.push(this.positions[i].y);
        pxyz.push(this.positions[i].z);
    }
    this.pxyz=pxyz;
    this.olaplacian=mulspMatrixVector(this.laplacian,pxyz);
}
deformed3.prototype.computeLaplacian=function(){
   var n=this.n-2;
   if(n>2){
        //computing triplets of vertex for computing uniform laplacian 
        var VertexTriplets=[];
        for(var i=0;i<n;i++){
            VertexTriplets.push([i,i+1,i+2]);
        }
        var L=zeros(3*n,3*n+6);
        for(var i = 0; i < n; i++){
            var v0 = VertexTriplets[i][0];
            var v1 = VertexTriplets[i][1];
            var v2 = VertexTriplets[i][2];
            L.val[3*i*L.n + 3*v1]=1;
            L.val[(3*i+1)*L.n + 3*v1+1]=1;
            L.val[(3*i+2)*L.n + 3*v1+2]=1;
            L.val[3*i*L.n + 3*v0]=-0.5;
            L.val[(3*i+1)*L.n + 3*v0+1]=-0.5;
            L.val[(3*i+2)*L.n + 3*v0+2]=-0.5;
            L.val[3*i*L.n + 3*v2]=-0.5;
            L.val[(3*i+1)*L.n + 3*v2+1]=-0.5;
            L.val[(3*i+2)*L.n + 3*v2+2]=-0.5;
        }
        this.laplacian=sparse(L);
        this.triplets=VertexTriplets;
        this.computeOriginalValues();
   }
   else{
       this.laplacian=[];
   }
}
deformed3.prototype.updateHandle=function(pos){
    var vector = new THREE.Vector3();
    vector.set( mouse.x ,mouse.y , 0.5 );
    vector.unproject( setup.camera);
    var cameraposition=setup.camera.position.clone();
    var dir = vector.sub(cameraposition).normalize();
    var t=plane.point.clone().sub(cameraposition).dot(plane.normal)/dir.dot(plane.normal);
    var point=cameraposition.add(dir.multiplyScalar(t));
    this.positions[this.tableHash[this.handle.toString()]].set(point.x,point.y,point.z);
    //this.curveVertex[this.tableHash[this.handle.toString()]].set(point.x,point.y,point.z);
    this.updateVertices3();
}
deformed3.prototype.updateVertices3=function(){
    //compute Ti
    //  |s  -h3  h2 tx|
    //  |h3  s  -h1 ty|
    //  |-h2 h1  s  tz|
    //  |0   0   0   1|
    
    //var newlapla=this.olaplacian.slice();
    var s=this.triplets.length;
    for(var j=0;j<s;j++){
        var pa=this.triplets[j][0];
        var p=this.triplets[j][1];
        var pb=this.triplets[j][2];
        var neibor=[pa,p,pb];
        var C=zeros(3*neibor.length,7);
        var bt=zeros(3*neibor.length);
        for(var i=0;i<neibor.length;i++){    
            C.val[3*i*C.n]=this.positions[neibor[i]].x;
            C.val[(3*i+1)*C.n]=this.positions[neibor[i]].y;
            C.val[(3*i+2)*C.n]=this.positions[neibor[i]].z;
            C.val[3*i*C.n+1]=0;
            C.val[(3*i+1)*C.n+1]=-this.positions[neibor[i]].z;
            C.val[(3*i+2)*C.n+1]=this.positions[neibor[i]].y;
            C.val[3*i*C.n+2]=this.positions[neibor[i]].z;
            C.val[(3*i+1)*C.n+2]=0;
            C.val[(3*i+2)*C.n+2]=-this.positions[neibor[i]].x;
            C.val[3*i*C.n+3]=-this.positions[neibor[i]].y;
            C.val[(3*i+1)*C.n+3]=this.positions[neibor[i]].x;
            C.val[(3*i+2)*C.n+3]=0;
            C.val[3*i*C.n+4]=1;
            C.val[(3*i+1)*C.n+5]=1;
            C.val[(3*i+2)*C.n+6]=1;
            bt[3*i]=this.positions[neibor[i]].x;
            bt[3*i+1]=this.positions[neibor[i]].y;
            bt[3*i+2]=this.positions[neibor[i]].z;
        }
        var tt=cgnr(C,bt);
        //compute transformed laplacian by Ti      
          
            var lx=this.olaplacian[3*j];
            var ly=this.olaplacian[3*j+1];
            var lz=this.olaplacian[3*j+2];
            this.olaplacian[3*j]=tt[0]*lx-tt[3]*ly+tt[2]*lz;
            this.olaplacian[3*j+1]=tt[3]*lx+tt[0]*ly-tt[1]*lz;
            this.olaplacian[3*j+2]=-tt[2]*lx+tt[1]*ly+tt[0]*lz;
    }
    
    var ml=this.laplacian.m/3;    
    
    // creating final matrix for fitting
    var constrain=[0,this.n-1];
    /*
    for(var i=0;i<this.left;i++){   
       constrain.push(i);
    }
    for(var i=this.right+1;i<this.n;i++){   
       constrain.push(i);
    }*/
    constrain.push(this.tableHash[this.handle.toString()]);
    //console.log(constrain);
    var A=zeros(3*ml+ 3*this.freeVertex.length + 3*constrain.length,3*this.n);
    var b=zeros(3*ml+ 3*this.freeVertex.length + 3*constrain.length);
    //var A=zeros(2*ml+2*constrain.length ,2*this.n);
    //var b=zeros(2*ml+2*constrain.length );
    var ri = 0;
    for(var i=0;i<this.laplacian.n;i++){
        var s = this.laplacian.rows[i];
        var e = this.laplacian.rows[i+1];
        for ( var k=s; k < e; k++) {
            A.val[ri + this.laplacian.cols[k] ] = this.laplacian.val[k];
        }
        ri += this.laplacian.n; 
        if(i<this.laplacian.m){
            b[i]=this.olaplacian[i];    
        }    
    }
    for(var i=0;i<this.freeVertex.length;i++){
        var v=this.freeVertex[i];
        if(i<this.freeVertex.length/3 || i>2*this.freeVertex.length/3){
            A.val[(2*ml + 2*i)*A.n + 2*v]=50;
            A.val[(2*ml + 2*i+1)*A.n + 2*v+1]=50;
            b[2*ml+ 2*i]=50*this.positions[v].x;
            b[2*ml+ 2*i+1]=50*this.positions[v].y;    
        }
        else{
            A.val[(2*ml + 2*i)*A.n + 2*v]=this.lowweight;
            A.val[(2*ml + 2*i+1)*A.n + 2*v+1]=this.lowweight;
            b[2*ml+ 2*i]=this.lowweight*this.positions[v].x;
            b[2*ml+ 2*i+1]=this.lowweight*this.positions[v].y;
        }
        
    }
    for(var i=0;i<constrain.length;i++){
        var v=constrain[i];
        A.val[(3*ml+3*this.freeVertex.length +3*i)*A.n + 3*v]=this.weight;
        A.val[(3*ml+3*this.freeVertex.length +3*i+1)*A.n + 3*v+1]=this.weight;
        A.val[(3*ml+3*this.freeVertex.length +3*i+2)*A.n + 3*v+2]=this.weight;
        b[3*ml + 3*this.freeVertex.length +3*i]=this.weight*this.positions[v].x;
        b[3*ml + 3*this.freeVertex.length +3*i+1]=this.weight*this.positions[v].y;
        b[3*ml + 3*this.freeVertex.length +3*i+2]=this.weight*this.positions[v].z;
    }
    var spA=sparse(A);
    var vxyz=spcgnr(spA,b);
    this.pxyz=vxyz;
    
    for(i=0;i<this.n;i++){
        this.positions[i].setX(vxyz[3*i]);
        this.positions[i].setY(vxyz[3*i+1]);
        this.positions[i].setZ(vxyz[3*i+2]);
    }
    this.curveObject.geometry.verticesNeedUpdate = true;
    /*var mesh = setup.scene.getObjectByName("mesh"); 
    if(mesh!=undefined) mesh.geometry.verticesNeedUpdate = true;   
    var wireframe=setup.scene.getObjectByName("wireframeMesh");
    setup.scene.remove(wireframe);
    wireframeLines = hemesh.toWireframeGeometry();
    var wireframe = new THREE.LineSegments(wireframeLines, new THREE.LineBasicMaterial({
        color: 0xff2222,
        opacity: 0.2,
        transparent: true,
    }));
    wireframe.name="wireframeMesh";
    setup.scene.add(wireframe);*/
    
    //FirstMatrixtoProcessCurvatureEdgeLength();
}


