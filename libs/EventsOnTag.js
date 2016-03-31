<<<<<<< HEAD
d3.select('#stepButton').on('click',function () {
=======
                  
 var stepbutton= document.getElementById('stepButton');    
 var clearbutton=document.getElementById('clearButton');    
 //clearbutton.onclick=
 d3.select('#stepButton').on('click',function () {
>>>>>>> 503521e0ae56a604af83cf1070691f2da1c8c667
     cancelRender=false;
     render();
     setup.controls.enabled=true;
     points=[];
     console.log(points);
     canvaswindows.on("mousedown",null);
     canvaswindows.on("mouseup",null);
     canvaswindows.on("mousemove",null);
     //canvaswindows.removeEventListener('click', onMouseClick);
     //window.addEventListener( 'mousemove', onMouseMove, false );
 });
 d3.select('#opButton').on('click',function () {
    var Linesam=setup.scene.getObjectByName("LineBoundary");
    var borderl=setup.scene.getObjectByName("borderLine"); 
    if(Linesam!=undefined ){
        Linesam.children=[];
    }
    if(borderl!=undefined ){
        borderl.children=[];
    }
    DrawGrid("Optimize");
    cancelRender=false;
    render(); 
    setTimeout(cancelAnimation,4000); 
 });
 d3.select('#clearButton').on('click',clearScene);
 d3.select('#assoButton').on('click',function () {
     drawAssociated();
     cancelRender=false;
     render(); 
     setTimeout(cancelAnimation,4000); 
 });
 d3.select('#inflationButton').on('click',function () {
    // Create the halfedge mesh from an OBJ
    var hemesh = new Hemesh();
<<<<<<< HEAD
    //var hemesh2 = new Hemesh();
    var VertexInteriores=toThreeVector3(GridMeshVertexArray); 
    var arraynow=createMesh(GridMeshFacesArray,offsetZ(VertexInteriores,sizeGrid),offsetZ(VertexInteriores,-sizeGrid)); 
    hemesh.fromFaceVertexArray(arraynow[0],arraynow[1]);
    var wireframeLines = hemesh.toWireframeGeometry();
     
    var geo = hemesh.toGeometry();
    
=======
    hemesh.fromFaceVertexArray(GridMeshFacesArray,toThreeVector3(GridMeshVertexArray));
    var wireframeLines = hemesh.toWireframeGeometry();
    var geo = hemesh.toGeometry();
>>>>>>> 503521e0ae56a604af83cf1070691f2da1c8c667
    var mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        color:  0x27B327,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        side:  THREE.DoubleSide,   
        polygonOffsetUnits: 0.1
    }));
<<<<<<< HEAD
 
     var wireframe = new THREE.Line(wireframeLines, new THREE.LineBasicMaterial({
=======
    var wireframe = new THREE.Line(wireframeLines, new THREE.LineBasicMaterial({
>>>>>>> 503521e0ae56a604af83cf1070691f2da1c8c667
        color: 0xff2222,
        opacity: 0.2,
        transparent: true,
    }), THREE.LineSegments);
    setup.scene.add(mesh,wireframe);
     cancelRender=false;
     render(); 
     //setTimeout(cancelAnimation,4000); 
 });
 d3.select('#drawButton').on('click',function () {
     cancelRender=false;
     render(); 
     setTimeout(cancelAnimation,4000); 
<<<<<<< HEAD
 });
d3.select("#checkWireframe").node().value
=======
 });
>>>>>>> 503521e0ae56a604af83cf1070691f2da1c8c667
