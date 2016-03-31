d3.select('#stepButton').on('click',function () {
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
    //var hemesh2 = new Hemesh();
    var VertexInteriores=toThreeVector3(GridMeshVertexArray); 
    var arraynow=createMesh(GridMeshFacesArray,offsetZ(VertexInteriores,sizeGrid),offsetZ(VertexInteriores,-sizeGrid)); 
    hemesh.fromFaceVertexArray(arraynow[0],arraynow[1]);
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
    setup.scene.add(mesh,wireframe);
     cancelRender=false;
     render(); 
     //setTimeout(cancelAnimation,4000); 
 });
 d3.select('#drawButton').on('click',function () {
     cancelRender=false;
     render(); 
     setTimeout(cancelAnimation,4000); 
 });
d3.select("#checkWireframe").node().value