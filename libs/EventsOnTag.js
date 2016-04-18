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
          ptd=MappingVerteToStroke2();
          if(ptd.length==0){
            drawAssociated();      
          }
          else{
              fixBoundaryPoints();
          }
          //cancelRender=false;
          //render();
          //setTimeout(cancelAnimation,4000);
      }
      else{
         console.log("ptd zero");
      }
 }
function inflationFunction3(){
    L=uniformLaplacian();
    var ci=FisrtIterationCurvaturesProcess();
    var el=FisrtIterationEdgeLength();
    var etaij=computeEdgeVector();
    var laplacian=computeIntegratedLaplacian(ci);
    IterationUpdateVector(laplacian,etaij);
    
}
function createInicialMesh() {
    
  
    var FacesVertices=createMesh2(); 
    hemesh.fromFaceVertexArray(FacesVertices[0],FacesVertices[1]); 
    hemesh.normalize();
    var wireframeLines = hemesh.toWireframeGeometry();
   // wireframeLines.faces=FacesVertices[0];
    
    var geo = hemesh.toGeometry();
    
    var mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        color:  0xd9d9d9,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        side:  THREE.DoubleSide,   
        polygonOffsetUnits: 0.1
    }));
 
     var wireframe = new THREE.LineSegments(wireframeLines, new THREE.LineBasicMaterial({
        color: 0xff2222,
        opacity: 0.2,
        transparent: true,
    }));
    setup.scene.remove(gridgeometry);
    var Linesam=setup.scene.getObjectByName("LineBoundary");
    var borderl=setup.scene.getObjectByName("borderLine"); 
    var debuglines=setup.scene.getObjectByName("DebugPoints");
    var debuglines2=setup.scene.getObjectByName("DebugPointsb");
    
    wireframe.name="wireframe";
    mesh.name="mesh";
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
     
}
function inflationFuntion2() {
    var r=pointSample.length;
    var n=gridBoundary.length;
    var interiorPointsNumber=GridMeshVertexArray.length;
    var FixedVertexPositions=[];
    var VertexInteriores=toThreeVector3(GridMeshVertexArray); 
    var FacesVertices=createMesh(GridMeshFacesArray,offsetZ(VertexInteriores,parseFloat(sizeGrid)),offsetZ(VertexInteriores,-sizeGrid)); 
    var m=FacesVertices[1].length;
    //hemesh.fromFaceVertexArray(FacesVertices[0],FacesVertices[1]); 
    var AllVertex=FacesVertices[1].slice();
    var AllFaces=FacesVertices[0].slice();
    for(var i=0;i<r;i++){
         //hemesh.addVertex(pointSample[i]);
         FixedVertexPositions.push(pointSample[i])
         FixedVertex.push(m+i);
    }
    AllVertex=AllVertex.concat(FixedVertexPositions);
    //hemesh.fromFaceVertexArray(AllFaces,AllVertex); 
    //compute faces
    var associated=[];
    var i0=0;
    for(var i=0;i<n;i++){
        if(gridBoundary[i].associated.indexOf(0)==-1){
            i0=i;
            break;
        }
    }
    for(var j=0;j<r;j++){
        var aux=searchAssociated(i0,j);
        associated.push(aux);
        i0=aux[aux.length-1];
    }
    //console.log(associated);
    //here add border faces 
    /*
    for(var j=1;j<r-1;j++){
         var pinitial=m+j-1;
         var pend=m+j+1;
         var le=associated[j].length;
         //console.log(associated[j]);
         //console.log([m+j,TableHashIndextoPosition[gridBoundary[associated[j][0]].index.toString()],pinitial]);
         //hemesh.addFace([m+j,pend,TableHashIndextoPosition[gridBoundary[associated[j][le-1]].index.toString()]]);
         //AllFaces.push([m+j,pend,TableHashIndextoPosition[gridBoundary[associated[j][le-1]].index.toString()]]);
         //AllFaces.push([m+j,TableHashIndextoPosition[gridBoundary[associated[j][le-1]].index.toString()],pend]);
         for(var k=1;k<associated[j].length;k++){
             var id=gridBoundary[associated[j][k]].index;    
             var id0=TableHashIndextoPosition[id.toString()];
             var id0mirror=interiorPointsNumber+id0;
             var pid=gridBoundary[associated[j][k-1]].index;    
             var pid0=TableHashIndextoPosition[pid.toString()];
             var pid0mirror=interiorPointsNumber+pid0;       
             AllFaces.push([m+j,id0,pid0]);
             //AllFaces.push([m+j,id0mirror,pid0mirror]);
             //console.log([m+j,id0,pid0]);
             //console.log(pinitial);
             //hemesh.addFace([m+j,id0,pid0]);
         }
         /*if(le==1){
             AllFaces.push([m+j,TableHashIndextoPosition[gridBoundary[associated[j][0]].index.toString()],pend]);
             var newo=(interiorPointsNumber+TableHashIndextoPosition[gridBoundary[associated[j][0]].index.toString()]);
             //AllFaces.push([pend,m+j,newo]);
             //AllFaces.push([pinitial,m+j,TableHashIndextoPosition[gridBoundary[associated[j][0]].index.toString()]]);
             //AllFaces.push([m+j,pinitial,interiorPointsNumber+TableHashIndextoPosition[gridBoundary[associated[j][0]].index.toString()]]);
         }
    }*/
    for(var j=0;j<r-1;j=j+2){
         var pinitial=m+((j-1+r)%r);
         var pend=m+j+1;
         var le=associated[j].length;
         //console.log(Orientation(pointSample[0],pointSample[1],pointSample[2]));
         var d0=pointSample[(j-1+r)%r].clone().sub(gridPointsArray[gridBoundary[associated[j][0]].index]).length();
         var d1=pointSample[(j-1+r)%r].clone().sub(gridPointsArray[gridBoundary[associated[j][le-1]].index]).length();
         if(d0<d1){
             AllFaces.push([pinitial,TableHashIndextoPosition[gridBoundary[associated[j][0]].index.toString()],m+j]);
             AllFaces.push([m+j,TableHashIndextoPosition[gridBoundary[associated[j][le-1]].index.toString()],pend]);
             AllFaces.push([m+j,interiorPointsNumber+TableHashIndextoPosition[gridBoundary[associated[j][0]].index.toString()],pinitial]);
             AllFaces.push([pend,interiorPointsNumber+TableHashIndextoPosition[gridBoundary[associated[j][le-1]].index.toString()],m+j]);
         }
         else{
             AllFaces.push([pinitial,TableHashIndextoPosition[gridBoundary[associated[j][le-1]].index.toString()],m+j]);
             AllFaces.push([m+j,TableHashIndextoPosition[gridBoundary[associated[j][0]].index.toString()],pend]);
             AllFaces.push([m+j,interiorPointsNumber+TableHashIndextoPosition[gridBoundary[associated[j][le-1]].index.toString()],pinitial]);
             AllFaces.push([pend,interiorPointsNumber+TableHashIndextoPosition[gridBoundary[associated[j][0]].index.toString()],m+j]);
         }
    }
    
    
    for(var j=0;j<r;j++){
         var d0=pointSample[(j-1+r)%r].clone().sub(gridPointsArray[gridBoundary[associated[j][0]].index]).length();
         var d1=pointSample[(j-1+r)%r].clone().sub(gridPointsArray[gridBoundary[associated[j][associated[j].length-1]].index]).length();
         if(d0<d1){
             for(var k=0;k<associated[j].length-1;k++){
                 var id=gridBoundary[associated[j][k]].index;    
                 var id0=TableHashIndextoPosition[id.toString()];
                 var id0mirror=interiorPointsNumber+id0;
                 var pid=gridBoundary[associated[j][k+1]].index;    
                 var pid0=TableHashIndextoPosition[pid.toString()];
                 var pid0mirror=interiorPointsNumber+pid0;       


                AllFaces.push([m+j,id0,pid0]);    


                 //AllFaces.push([m+j,id0mirror,pid0mirror]);
                 //console.log([m+j,id0,pid0]);
                 //console.log(pinitial);
                 //hemesh.addFace([m+j,id0,pid0]);
             }
         }
         else{
             for(var k=associated[j].length-1;k>0;k=k-1){
                 var id=gridBoundary[associated[j][k]].index;    
                 var id0=TableHashIndextoPosition[id.toString()];
                 var id0mirror=interiorPointsNumber+id0;
                 var pid=gridBoundary[associated[j][k-1]].index;    
                 var pid0=TableHashIndextoPosition[pid.toString()];
                 var pid0mirror=interiorPointsNumber+pid0;       


                AllFaces.push([m+j,id0,pid0]);    


                 //AllFaces.push([m+j,id0mirror,pid0mirror]);
                 //console.log([m+j,id0,pid0]);
                 //console.log(pinitial);
                 //hemesh.addFace([m+j,id0,pid0]);
             }
         }
    }
    hemesh.fromFaceVertexArray(AllFaces,AllVertex); 
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
    
    //L=uniformLaplacian();
    //var prova=FisrtIterationCurvaturesProcess();
    //var prov2=IterationCurvaturesProcess(prova);
    //var meancurvatures=FirstCurvaturesCurve();
    //console.log(meancurvatures.length);
    //console.log(r);
    //var lapla=uniformLaplacian();
    //console.log(lapla);
    //console.log(hemesh.positions.length-r);
    
     
     setup.scene.add(mesh,wireframe);
    
}
function inflationFuntion() {
    // Create the halfedge mesh from an OBJ
    var r=pointSample.length;
    var n=gridBoundary.length;
    var interiorPointsNumber=GridMeshVertexArray.length;
    var FixedVertexPositions=[];
    var VertexInteriores=toThreeVector3(GridMeshVertexArray); 
    var FacesVertices=createMesh(GridMeshFacesArray,offsetZ(VertexInteriores,parseFloat(sizeGrid)),offsetZ(VertexInteriores,-sizeGrid)); 
    hemesh.fromFaceVertexArray(FacesVertices[0],FacesVertices[1]); 
    var AllVertex=FacesVertices[1].slice();
    var AllFaces=FacesVertices[0].slice();
    for(var i=0;i<r;i++){
         hemesh.addVertex(pointSample[i]);
         FixedVertexPositions.push(pointSample[i])
         FixedVertex.push(FacesVertices[1].length+i);
    }
    AllVertex=AllVertex.concat(FixedVertexPositions);
    console.log(AllVertex.length,2*interiorPointsNumber+r);
    for(var i=0;i<n;i++){
         var m=FacesVertices[1].length;
         var j=gridBoundary[i].associated.length;
         var id=gridBoundary[i].index;    
         var id0=TableHashIndextoPosition[id.toString()];
         var id0mirror=interiorPointsNumber+id0;    
         var sid=gridBoundary[(i+1)%n].index;    
         var sid0=TableHashIndextoPosition[sid.toString()];
         var sid0mirror=interiorPointsNumber+sid0;
         var copyAssociated=gridBoundary[i].associated.slice();
         //console.log(copyAssociated);
         //console.log(i);
         copyAssociated.sort(function(a, b){return a-b});   
         if(j>1){
            for(var k=0;k<j-1;k++){
               if(copyAssociated.indexOf(0)==-1){
                  var id1=m+copyAssociated[k]; 
                  var id2=m+copyAssociated[k+1];             
               }    
               else{
                  var id1=m+gridBoundary[i].associated[k]; 
                  var id2=m+gridBoundary[i].associated[k+1];             
               }
               //hemesh.addFace([id0,id1,id2]);
               //hemesh.addFace([id0mirror,id2,id1]);
               hemesh.addFaces([[id0,id1,id2],[id0mirror,id2,id1]]);
               //AllFaces.push([id0,id1,id2]);
               //AllFaces.push([id0mirror,id2,id1]);    
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
               //AllFaces.push([pid0,id3,id0]);
               //AllFaces.push([id0,id3,sid0]);
               //AllFaces.push([id0mirror,id3,pid0mirror]);
               //AllFaces.push([sid0mirror,id3,id0mirror]);
         } 
         
    }
    for(var i=0;i<n;i++){
         var j=gridBoundary[i].associated.length;
         var k=gridBoundary[(i+1)%n].associated.length;
         var m=FacesVertices[1].length;
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
               //hemesh.addFaces([[id0,id4,sid0],[sid0mirror,id4,id0mirror]]);    
               //AllFaces.push([id0,id4,sid0]);
               //AllFaces.push([sid0mirror,id4,id0mirror]);
       }
    }
    //hemesh.fromFaceVertexArray(AllFaces,AllVertex); 
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
    setup.scene.remove(LineSample);
    L=uniformLaplacian();
    //var prova=FisrtIterationCurvaturesProcess();
    //var prov2=IterationCurvaturesProcess(prova);
    //var meancurvatures=FirstCurvaturesCurve();
    //console.log(meancurvatures.length);
    //console.log(r);
    //var lapla=uniformLaplacian();
    //console.log(lapla);
    //console.log(hemesh.positions.length-r);
    
     
     setup.scene.add(mesh);
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
    //drawAssociated();
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
     inflationFunction3();
 });
 d3.select('#meshButton').on('click',function(){
     createInicialMesh();
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
   if(points.length!=0){    
       fixBoundaryPoints(); 
       //drawBoundary(gridBoundary);
       inflationFuntion();    
       //OtherMouseControls();    
   } 
   //setTimeout(cancelAnimation,1000);     
});