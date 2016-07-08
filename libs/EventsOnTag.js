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
          setTimeout(fixBoundaryPoints,1);
          //cancelRender=false;
          //render();
          //setTimeout(cancelAnimation,4000);
      }
      else{
         FixedVertex=[];
         ListOfCurves=[];
         for(var i=GridMeshVertexArray.length-pointSample.length;i<GridMeshVertexArray.length;i++){
               FixedVertex.push(i);
               if(i<0){
                   console.log("problem in the curve ");
                   FixedVertex=[];
                   break;
               }
         }
         console.log("List of curves until now");
         console.log(ListOfCurves);
         ListOfCurves.push([0,FixedVertex.length-1]);
         ListOfCurvesGeometry=[];  
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
    //Ac={};
    AcT={};
    invAcTAc={};
}

function oneStepSurfaceoptimization(laplaX,laplaY,laplaZ){
     var n=L.n;
    //var fL=full(L);
    var el=computeAverageEdgeLength();
    var total = 0;
    for(var i = 0; i < el.length; i++) {
        total += el[i];
    }
    var avg = total / el.length
    //var cid=IterationCurvaturesProcess(ci);
    var eld=IterationEdgeLength(mulScalarVector(avg,ones(el.length)));
    var etaarray=computeEdgeVector(eld);
    /*var lx=zeros(n);
    var ly=zeros(n);
    var lz=zeros(n);
    for(var i=0;i<n;i++){
        lx[i]=hemesh.positions[i].x;
        ly[i]=hemesh.positions[i].y;
        lz[i]=hemesh.positions[i].z;
    }
    lx=mulspMatrixVector(L,lx);
    ly=mulspMatrixVector(L,ly);
    lz=mulspMatrixVector(L,lz);*/
    var lx=laplaX;
    var ly=laplaY;
    var lz=laplaZ;
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
        b.val[3*i]=lx[i];
        b.val[3*i+1]=ly[i];
        b.val[3*i+2]=lz[i];
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
    var wel=1;
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
    setTimeout(updateRenderMesh,100);
}

function createInicialMesh() {
    if(ModeDrawInitialCurve){
        fixBoundaryPoints();
    }  
    var FacesVertices=createMesh2(); 
    hemesh=new Hemesh();
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
        vertexColors: THREE.FaceColors,
        polygonOffsetUnits: 0.1
    }));
    //mesh.geometry.dynamic = true;
    var wireframe = new THREE.LineSegments(wireframeLines, new THREE.LineBasicMaterial({
        color: 0xff2222,
        opacity: 0.2,
        transparent: true,
    }));
    setup.scene.remove(gridgeometry);
    dispose3(gridgeometry);
    var Linesam=setup.scene.getObjectByName("LineBoundary");
    var borderl=setup.scene.getObjectByName("borderLine"); 
    var debuglines=setup.scene.getObjectByName("DebugPoints");
    var debuglines2=setup.scene.getObjectByName("DebugPointsb");
    
    wireframe.name="wireframeMesh";
    mesh.name="mesh";
    
    if(Linesam!=undefined ){
        dispose3(Linesam);
        Linesam.children=[];
    }
    if(borderl!=undefined ){
        dispose3(borderl);
        borderl.children=[];
    }
    if(debuglines!=undefined ){
       setup.scene.remove(debuglines);
       dispose3(debuglines);
    }
    if(debuglines2!=undefined ){
       setup.scene.remove(debuglines2);
       dispose3(debuglines2);
    }
    ListOfCurvesGeometry.push(new THREE.Geometry());
    for(var i=ListOfCurves[0][0];i<=ListOfCurves[0][1];i++){
        ListOfCurvesGeometry[0].vertices.push(hemesh.positions[FixedVertex[i]]);
    }
    ListOfCurvesGeometry[0].vertices.push(hemesh.positions[FixedVertex[ListOfCurves[0][0]]]);
    //ListOfCurvesGeometry[0].vertices=LineSample.geometry.vertices.slice();
    //ListOfCurvesObject[0]=new THREE.LineSegments(ListOfCurvesGeometry[0], materialSample);
    ListOfCurvesObject[0]=new THREE.Line(ListOfCurvesGeometry[0], materialSample);
    ListOfCurvesObject[0].name="curve0";
    console.log("ncurves after first render",ListOfCurves.length);
    setup.scene.remove(LineSample);
    dispose3(LineSample);
    setup.scene.add(ListOfCurvesObject[0]);
    setup.scene.add(mesh,wireframe);
    GridMeshVertexArray=[];
    GridMeshFacesArray=[];
    TableHashIndextoPosition=[];
    dispose3(LineStroke);
    //LineStroke={};
}
function OtherMouseControls() {
     points=[];
     //console.log(points);
     //canvaswindows.on("mousedown",null);
     ///canvaswindows.on("mouseup",null);
     //canvaswindows.on("mousemove",null);
     setup.controls.enabled=true;
     ModeCurveDeformation=false;     
     ModeFibermesh=true;
     ModeDrawInitialCurve=false;
     ModeDebug=false;
     ModeChangeType=false;
     ModeAddCurve=false;
     cancelRender=false;
     render();
}

function saveTextAsFile(textToWrite){
	var textFileAsBlob = new Blob([textToWrite], {type:'text/plain'});
	var fileNameToSaveAs = "mesh";

	var downloadLink = document.createElement("a");
	downloadLink.download = fileNameToSaveAs;
	downloadLink.innerHTML = "Download File";
	if (window.URL != null )
	{
		// Chrome allows the link to be clicked
		// without actually adding it to the DOM.
		downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
	}
	else{
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
    clearScene();
	fileReader.onload = function(fileLoadedEvent) 
	{
        text = String(fileReader.result);
        //hemesh=new Hemesh();
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
        dispose3(gridgeometry);
        var Linesam=setup.scene.getObjectByName("LineBoundary");
        var borderl=setup.scene.getObjectByName("borderLine"); 
        var debuglines=setup.scene.getObjectByName("DebugPoints");
        var debuglines2=setup.scene.getObjectByName("DebugPointsb");

        wireframe.name="wireframe";
        mesh.name="mesh";
        
        if(Linesam!=undefined ){
            dispose3(Linesam);
            Linesam.children=[];
        }
        if(borderl!=undefined ){
            dispose3(borderl);
            borderl.children=[];
        }
        if(debuglines!=undefined ){
           setup.scene.remove(debuglines);
           dispose3(debuglines);
        }
        if(debuglines2!=undefined ){
           setup.scene.remove(debuglines2);
           dispose3(debuglines);    
        }
        gridgeometry={};    

        setup.scene.add(mesh,wireframe);

        };
        fileReader.readAsText(fileToLoad);
        L=uniformLaplacian();
        
    
}


d3.select('#opButton').on('click',function () {
    var Linesam=setup.scene.getObjectByName("LineBoundary");
    var borderl=setup.scene.getObjectByName("borderLine"); 
    
    dispose3(Linesam);    
    dispose3(borderl);
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
d3.select("#checkMeshROI").on("click",function(){
   if(checkMeshROI.checked){
       drawMeshROI(true);
   }    
   else{
       drawMeshROI(false);     
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
d3.select("#backButton").on("click",function(){
   if (pathCurve.center!=undefined) pathCurve.goLast();
   else if(ListOfCurves.length!=0){
       var mesh=setup.scene.getObjectByName("mesh");
       for(var i=0;i<hemesh.positions.length;i++){
           hemesh.positions[i].copy(copyMeshPositions[i]);
       }
       console.log("update vertex");
       /*var colorA=new THREE.Color(0,0,0);
       for(var i=0;i<faceArrayOfNewCurve.length;i++){
           if(i!=faceArrayOfNewCurve[i]){
               colorA.copy(mesh.geometry.faces[i].color);
               break;
           }
       }
       for(var i=0;i<faceArrayOfNewCurve.length;i++){
           mesh.geometry.faces[faceArrayOfNewCurve[i]].color.copy(colorA);
       }
       mesh.geometry.colorsNeedUpdate = true;
       */
       console.log(FixedVertex.length);
       FixedVertex=FixedVertex.slice(0,ListOfCurves[ListOfCurves.length-1][0]);
       console.log(FixedVertex.length);
       var curveCurrent=setup.scene.getObjectByName("curve"+(ListOfCurves.length-1).toString());
       console.log(curveCurrent.name);
       setup.scene.remove(curveCurrent);
       dispose3(curveCurrent);
       ListOfCurves.pop();
       ListOfCurvesGeometry.pop();
       ListOfCurvesObject.pop();
       updateRenderMeshWithoutFlag();
       console.log("copymesh");
   }
   console.log("back finish") ;
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
       ModeCurveDeformation=false;     
       ModeDrawInitialCurve=false;
       ModeDebug=false;
       ModeAddCurve=false;
       ModeChangeType=false;
       ModeFibermesh=true;
       OtherMouseControls();    
   } 
   //setTimeout(cancelAnimation,1000);     
});
d3.select("#fileToLoad").on("change",loadFileAsText);

d3.select("#cdButton").on("click",function(){
     ModeCurveDeformation=true;     
     ModeFibermesh=false;
     ModeDrawInitialCurve=false;
     ModeDebug=false;
     ModeAddCurve=false;
     ModeChangeType=false;
     console.log("modecurve deformation");
     setup.controls.enabled=false;
     scancelRender=false;
     render();
});
d3.select("#addButton").on("click",function(){
     setup.controls.enabled=false;
     ModeCurveDeformation=false;     
     ModeFibermesh=false;
     ModeDrawInitialCurve=false;
     ModeDebug=false;
     ModeAddCurve=true;
     ModeChangeType=false;
     console.log("add curve ");
     copyMeshPositions=[];
     for(var i=0;i<hemesh.positions.length;i++){
        copyMeshPositions.push(hemesh.positions[i].clone());
     }
});
d3.select("#startButton").on("click",startButtonF);
d3.select("#inflationStepButton").on("click",function (){
    oneStepSurfaceoptimization(pathCurve.OXLaplacian,pathCurve.OYLaplacian,pathCurve.OZLaplacian);
});
d3.select("#optQualityButton").on("click",function (){
    OptimizeQualityTriangles();
    setTimeout(updateRenderMesh,100);
});
d3.select('#finishButton').on('click',OtherMouseControls);
function startButtonF(){
     setup.controls.enabled=true;
     canvaswindows.style('cursor','default');
     if(ModeCurveDeformation) ListOfCurvesObject[0].material.color.set(0x0015FF);
     ModeCurveDeformation=false;     
     ModeFibermesh=true;
     ModeDrawInitialCurve=false;
     ModeDebug=false;
     ModeAddCurve=false;
     ModeChangeType=false;
}
function OptimizeQualityTriangles(){
    var n=L.n;
    var A=zeros(2*n,n);
    var bx=zeros(2*n);
    var by=zeros(2*n);
    var bz=zeros(2*n);
    var laplaCotan=[];
    var meancurvature=[];
    for(var i=0;i<n;i++){
        var la=LaplacianCotangent(i)
        laplaCotan.push(la);
        meancurvature.push(la.length()/2);
    }
    meancurvature.sort();
    var Q1=meancurvature[Math.round(n/4)];
    var Q3=meancurvature[Math.round(3*n/4)];
    var IQ=Q3-Q1;
    var kmin=0;
    var kmax=meancurvature.length-1;
    var weight=zeros(n);
    for(var i=n-1;i>0;i=i-1){
        if(meancurvature[i]<Q3+3*IQ){
            kmax=i;
            break;
        }
    }
    var ct=100;
    for(var i=kmax+1;i<n;i++){
        weight[i]=ct;
    }
    for(var i=0;i<kmax;i++){
        weight[i]=(ct/(meancurvature[kmax]-meancurvature[kmin]))*meancurvature[i]-(ct/(meancurvature[kmax]-meancurvature[kmin]))*meancurvature[kmin];
    }
    for(var i=n;i<2*n;i++){
        A.val[i*A.n+i-n]=weight[i-n]; 
        bx[i]=weight[i-n]*hemesh.positions[i-n].x;
        by[i]=weight[i-n]*hemesh.positions[i-n].y;
        bz[i]=weight[i-n]*hemesh.positions[i-n].z;
    }
    var ri = 0;
    for (var i = 0; i < n; i++) {
			var s = L.rows[i];
			var e = L.rows[i+1];
			for ( var k=s; k < e; k++) {
				A.val[ri + L.cols[k] ] = L.val[k];
			}
			ri += n; 
            bx[i]=laplaCotan[i].x;
            by[i]=laplaCotan[i].y;
            bz[i]=laplaCotan[i].z;
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
    console.log("optimization quality finish");
}
