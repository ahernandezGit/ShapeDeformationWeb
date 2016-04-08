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
         copyAssociated.sort();   
         if(j>1){
            for(var k=0;k<j-1;k++){
               var id1=m+gridBoundary[i].associated[k]; 
               var id2=m+gridBoundary[i].associated[k+1];         
               hemesh.addFace([id0,id1,id2]);
               hemesh.addFace([id0mirror,id2,id1]); 
            }
         }
         else if(i>0){ 
               var id3=m+gridBoundary[i].associated[0];
               var pid=gridBoundary[(i-1)].index;    
               var pid0=TableHashIndextoPosition[pid.toString()];
               var pid0mirror=interiorPointsNumber+pid0;    
               hemesh.addFace([pid0,id3,id0]);
               hemesh.addFace([id0,id3,sid0]);
              // hemesh.addFace([id0mirror,id3,pid0mirror]); 
              //   hemesh.addFace([sid0mirror,id3,id0mirror]); 
         }
         if(orientationSample==-1){
               
               var id4=m+gridBoundary[i].associated[gridBoundary[i].associated.length-1];
               console.log(gridBoundary[i].associated[gridBoundary[i].associated.length-1]);
               console.log(gridBoundary[i].associated);
               //hemesh.addFace([id0,id3,sid0]);
               //hemesh.addFace([sid0mirror,id3,id0mirror]);
         }
    }
 
    
    var wireframeLines = hemesh.toWireframeGeometry();
     
    var geo = hemesh.toGeometry();
    
    var mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        color:  0x27B327,
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
    if(Linesam!=undefined ){
        Linesam.children=[];
    }
    if(borderl!=undefined ){
        borderl.children=[];
    }
    gridgeometry={};
    setup.scene.add(mesh,wireframe);
    //applyFairing(0.01,mesh,hemesh);
     //cancelRender=false;
     //render(); 
     //setTimeout(cancelAnimation,4000); 
 }
function OtherMouseControls() {
     setup.controls.enabled=true;
     points=[];
     console.log(points);
     canvaswindows.on("mousedown",null);
     canvaswindows.on("mouseup",null);
     canvaswindows.on("mousemove",null);
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