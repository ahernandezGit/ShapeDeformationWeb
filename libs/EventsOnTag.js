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

    FirstMatrixtoProcessCurvatureEdgeLength();
    matrixtoProcessCurvatureEdgeLength();
    
    var ci=FisrtIterationCurvaturesProcess();
    //console.log(ci);
    var el=FisrtIterationEdgeLength();
    //console.log(el);
    var etaij=computeEdgeVector(el);
    var laplacian=computeIntegratedLaplacian(ci);
 
    IterationUpdateVector(laplacian,etaij);    
    var t=0;
    while(t<2){
        var cid=IterationCurvaturesProcess(ci);
        var eld=IterationEdgeLength(el);
   
        var etaijd=computeEdgeVector(eld);
        var laplaciand=computeIntegratedLaplacian(cid);
        IterationUpdateVector(laplaciand,etaijd);
        ci=cid;
        el=computeAverageEdgeLength();
        t++;
    }
    setTimeout(updateRenderMesh,500);
    Ac={};
    AcT={};
    invAcTAc={};
    ListOfCurves.push([0,FixedVertex.length-1]);
}

function createInicialMesh() {
      
    var FacesVertices=createMesh2(); 
    hemesh.fromFaceVertexArray(FacesVertices[0],FacesVertices[1]); 
    //hemesh.normalize();
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
    ListOfCurvesGeometry.push(new THREE.Geometry());
    for(var i=0;i<LineSample.geometry.vertices.length-1;i++){
        ListOfCurvesGeometry[0].vertices.push(LineSample.geometry.vertices[i],LineSample.geometry.vertices[i+1]);
    }
    ListOfCurvesObject[0]=new THREE.LineSegments(ListOfCurvesGeometry[0], materialSample);
    setup.scene.remove(LineSample);
    setup.scene.add(ListOfCurvesObject[0]);
    setup.scene.add(mesh,wireframe);
     
}
function OtherMouseControls() {
     points=[];
     console.log(points);
     //canvaswindows.on("mousedown",null);
     ///canvaswindows.on("mouseup",null);
     //canvaswindows.on("mousemove",null);
     setup.controls.enabled=true;
     cancelRender=false;
     render();
}

function saveTextAsFile(textToWrite){
	var textFileAsBlob = new Blob([textToWrite], {type:'text/plain'});
	var fileNameToSaveAs = "mesh";

	var downloadLink = document.createElement("a");
	downloadLink.download = fileNameToSaveAs;
	downloadLink.innerHTML = "Download File";
	if (window.URL != null)
	{
		// Chrome allows the link to be clicked
		// without actually adding it to the DOM.
		downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
	}
	else
	{
		// Firefox requires the link to be added to the DOM
		// before it can be clicked.
		downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
		downloadLink.onclick = destroyClickedElement;
		downloadLink.style.display = "none";
		document.body.appendChild(downloadLink);
	}

	downloadLink.click();
}

function destroyClickedElement(event){
	document.body.removeChild(event.target);
}

function loadFileAsText(){
	var fileToLoad = document.getElementById("fileToLoad").files[0];

	var fileReader = new FileReader();
    var text="";
	fileReader.onload = function(fileLoadedEvent) 
	{
        text = String(fileReader.result);
        hemesh=new Hemesh();
        hemesh.fromOBJ(text); 
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

        };
        fileReader.readAsText(fileToLoad);
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
     ModeDrawInitialCurve=false;
     ModeFibermesh=true;
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
d3.select("#checkMesh").on("click",function(){
   if(checkMesh.checked){
       drawMesh(true);
   }    
   else{
       drawMesh(false);     
   }
});

d3.select("#exportButton").on("click",function(){
   if(hemesh.positions.length!=0){
       var stringmesh=hemesh.toOBJ();
       saveTextAsFile(stringmesh);
   }    
   
});
d3.select("#uploadButton").on("click",function(){
   hemesh=new Hemesh();    
   console.log(loadFileAsText());    
   //hemesh.fromOBJ(loadFileAsText());
});

d3.select("#radioSBS").on("click",function(){
   document.getElementById("buttonsSBS").style.display="block"; 
   document.getElementById("buttonsFiber").style.display="none"; 
   mode="sbs";
});
d3.select("#radioFibermesh").on("click",function(){
   console.log("fibermesh");
   document.getElementById("buttonsSBS").style.display="none"; 
   document.getElementById("buttonsFiber").style.display="block"; 
   mode="fiber";
   if(points.length!=0){    
       fixBoundaryPoints(); 
       createInicialMesh();
       inflationFunction3();    
       OtherMouseControls();    
   } 
   //setTimeout(cancelAnimation,1000);     
});
d3.select("#fileToLoad").on("change",loadFileAsText);

d3.select("#cdButton").on("click",function(){
     setup.controls.enabled=false;
     ModeCurveDeformation=true;     
     ModeFibermesh=false;
     ModeDrawInitialCurve=false;
     ModeDebug=false;
     //canvaswindows.on("mousedown",null);
     //canvaswindows.on("mouseup",null);
     //canvaswindows.on("mousemove",null);
     
});
d3.select("#startButton").on("click",function(){
     setup.controls.enabled=true;
     ModeCurveDeformation=false;     
     ModeFibermesh=true;
     ModeDrawInitialCurve=false;
     ModeDebug=false;
});