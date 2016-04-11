function fixBoundaryPoints() {
      if(ptd.length!=0){
          var newPoinSample=[];
          for(var i=0;i<pointSample.length;i++){
              if( ptd.indexOf(i)==-1){
                newPoinSample.push(pointSample[i]);    
              }
          }
          updatePointSample(newPoinSample);
          drawSampleCurve();
          for(var i=0;i<gridBoundary.length;i++){
              gridBoundary[i].associated=[];
          }
          ptd=MappingVerteToStroke();
          drawAssociated();
          //cancelRender=false;
          //render();
          //setTimeout(cancelAnimation,4000);
      }
      else{
         console.log("ptd zero");
      }
 }
function inflationFuntion() {
    // Create the halfedge mesh from an OBJ
    var r=pointSample.length;
    var n=gridBoundary.length;
    var interiorPointsNumber=GridMeshVertexArray.length;
    var hemesh=new Hemesh();
    var VertexInteriores=toThreeVector3(GridMeshVertexArray); 
    var FacesVertices=createMesh(GridMeshFacesArray,offsetZ(VertexInteriores,parseFloat(sizeGrid)),offsetZ(VertexInteriores,-sizeGrid)); 
    hemesh.fromFaceVertexArray(FacesVertices[0],FacesVertices[1]);
     
    for(var i=0;i<r;i++){
         hemesh.addVertex(pointSample[i]);
    }  
    if(pointSample.length!=0){
        var orientationSample=Orientation(pointSample[0],pointSample[1],pointSample[2]);
        console.log(orientationSample);
    }
    for(var i=0;i<n;i++){
         var m=hemesh.positions.length-r;
         var j=gridBoundary[i].associated.length;
         var id=gridBoundary[i].index;    
         var id0=TableHashIndextoPosition[id.toString()];
         var id0mirror=interiorPointsNumber+id0;    
         var sid=gridBoundary[(i+1)%n].index;    
         var sid0=TableHashIndextoPosition[sid.toString()];
         var sid0mirror=interiorPointsNumber+sid0;
         var copyAssociated=gridBoundary[i].associated.slice();
         copyAssociated.sort(function(a, b){return a-b});   
         if(j>1){
            for(var k=0;k<j-1;k++){
               var id1=m+gridBoundary[i].associated[k]; 
               var id2=m+gridBoundary[i].associated[k+1];         
               //hemesh.addFace([id0,id1,id2]);
               //hemesh.addFace([id0mirror,id2,id1]);
               hemesh.addFaces([[id0,id1,id2],[id0mirror,id2,id1]]);
               //console.log("normais");
               //console.log("i ",i);    
               //console.log([id0,id1,id2],[id0mirror,id2,id1]);    
            }
            
         }
         else{
               var id3=m+gridBoundary[i].associated[0];
               var pid=gridBoundary[(i-1+n)%n].index;    
               var pid0=TableHashIndextoPosition[pid.toString()];
               var pid0mirror=interiorPointsNumber+pid0;    
               /*console.log("log");
               console.log("i=",i);
               console.log("associated",gridBoundary[i].associated);
               console.log("m=",m);
               console.log("ido=",id0);
               console.log("sdo=",sid0);
               console.log("pdo=",pid0);
               console.log("id3=",id3);*/
               hemesh.addFaces([[pid0,id3,id0],[id0,id3,sid0],[id0mirror,id3,pid0mirror],[sid0mirror,id3,id0mirror]]);
         }
         
    }
    
    for(var i=0;i<n;i++){
         var j=gridBoundary[i].associated.length;
         var k=gridBoundary[(i+1)%n].associated.length;
         var m=hemesh.positions.length-r;
         var AssociatedJ=gridBoundary[i].associated;
         var AssociatedK=gridBoundary[(i+1)%n].associated;
         var id=gridBoundary[i].index;    
         var id0=TableHashIndextoPosition[id.toString()];
         var id0mirror=interiorPointsNumber+id0;    
         var sid=gridBoundary[(i+1)%n].index;    
         var sid0=TableHashIndextoPosition[sid.toString()];
         var sid0mirror=interiorPointsNumber+sid0;
         if(j>1 && k>1){
               var id4;
               for(var p=0;p<j;p++){
                   if(AssociatedK.indexOf(AssociatedJ[p])!=-1){
                       id4=m+AssociatedJ[p];
                       break;
                   }
               } 
               hemesh.addFaces([[id0,id4,sid0],[sid0mirror,id4,id0mirror]]);    
       }
    }
   
    var wireframeLines = hemesh.toWireframeGeometry();
     
    var geo = hemesh.toGeometry();
    
    var mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        color:  0xd9d9d9,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        side:  THREE.DoubleSide,   
        polygonOffsetUnits: 0.1
    }));
 
     var wireframe = new THREE.Line(wireframeLines, new THREE.LineBasicMaterial({
        color: 0xff2222,
        opacity: 0.2,
        transparent: true,
    }), THREE.LineSegments);
    setup.scene.remove(gridgeometry);
    var Linesam=setup.scene.getObjectByName("LineBoundary");
    var borderl=setup.scene.getObjectByName("borderLine"); 
    var debuglines=setup.scene.getObjectByName("DebugPoints");
    var debuglines2=setup.scene.getObjectByName("DebugPointsb");
    if(Linesam!=undefined ){
        Linesam.children=[];
    }
    if(borderl!=undefined ){
        borderl.children=[];
    }
    if(debuglines!=undefined ){
       setup.scene.remove(debuglines);
    }
    if(debuglines2!=undefined ){
       setup.scene.remove(debuglines2);
    }
    gridgeometry={};
    setup.scene.add(mesh,wireframe);
    //applyFairing(0.01,mesh,hemesh);
     //cancelRender=false;
     //render(); 
     //setTimeout(cancelAnimation,4000); 
 }
function OtherMouseControls() {
     
     points=[];
     console.log(points);
     canvaswindows.on("mousedown",null);
     canvaswindows.on("mouseup",null);
     canvaswindows.on("mousemove",null);
     setup.controls.enabled=true;
     cancelRender=false;
     render();
     //canvaswindows.removeEventListener('click', onMouseClick);
     //window.addEventListener( 'mousemove', onMouseMove, false );
}
d3.select('#finishButton').on('click',OtherMouseControls);
 d3.select('#opButton').on('click',function () {
    var Linesam=setup.scene.getObjectByName("LineBoundary");
    var borderl=setup.scene.getObjectByName("borderLine"); 
    if(Linesam!=undefined ){
        Linesam.children=[];
    }
    if(borderl!=undefined ){
        borderl.children=[];
    }
    console.log("opt ative");
    OptimizeValence(); 
    //ptd=MappingVerteToStroke(); 
    drawAssociated();
    drawBoundary(gridBoundary); 
    cancelRender=false;
    render(); 
    setTimeout(cancelAnimation,1000); 
 });
 d3.select('#clearButton').on('click',clearScene);
 d3.select('#assoButton').on('click',function () {
     drawAssociated();
     cancelRender=false;
     render(); 
     setTimeout(cancelAnimation,1000); 
 });
 d3.select('#inflationButton').on('click',function(){
     inflationFuntion();
     OtherMouseControls();
     //cancelRender=false;
     //render();
     //setTimeout(cancelAnimation,1000);
 });
 d3.select('#drawButton').on('click',function () {
     cancelRender=false;
     render(); 
     setTimeout(cancelAnimation,1000); 
 });
d3.select('#fixButton').on('click',function (){
    fixBoundaryPoints();
    cancelRender=false;
    render();
    setTimeout(cancelAnimation,1000);
});
d3.select("#checkGrid").on("click",function(){
   if(checkGrid.checked){
       drawGrid(true);
   }    
   else{
       drawGrid(false);     
   }
});
d3.select("#radioSBS").on("click",function(){
   document.getElementById("buttonsSBS").style.display="block"; 
   mode="sbs";
});
d3.select("#radioFibermesh").on("click",function(){
   console.log("fibermesh");
   document.getElementById("buttonsSBS").style.display="none"; 
   mode="fiber";
   fixBoundaryPoints(); 
   drawBoundary(gridBoundary);
   inflationFuntion();    
   cancelRender=false;
   render(); 
   //setTimeout(cancelAnimation,1000);     
});