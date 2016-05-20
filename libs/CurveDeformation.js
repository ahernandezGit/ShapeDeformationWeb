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
    /*this.tableHash=[];
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
    },h);*/
    this.initializeMesh();
    //console.log(this.boundary);
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
        var le=1.5*this.radius;
        //var yellow= new THREE.Color(0.93, 0.85, 0.05);
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
    this.radius=point.clone().distanceTo(hemesh.positions[this.handle]);
    this.computeVertex();
    //console.log(this.radius);
}
pathToEdit.prototype.updatelaplacians=function(){
    var n=this.meshDS.positions.length;
    var L0=zeros(n-1,n);
    var L1=zeros(n,n);
    var copy=this.meshDS;
    //console.log(copy);
    for(var i=0;i<n;i++){
        L1.val[i*n+i]=1.0;    
        var h=this.meshDS.vertexHalfedge(i);
        //console.log(h);
        var di=this.meshDS.vertexValence(i);
        copy.vertexCirculatorPartial(function(he){
            //console.log(he);
            var j=copy.halfedgeSource(he);
            L1.val[i*n+j]=-1/di;    
        },h);
        if(i<n-1){
            L0.val[i*n+i]=-1;
            L0.val[i*n+i+1]=1;
        }
    }
    this.laplacian0=sparse(L0);
    this.laplacian1=sparse(L1);
}