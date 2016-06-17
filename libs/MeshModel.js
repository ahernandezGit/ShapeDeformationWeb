
// Yields a different mesh material depending on the number of 
			// the connected component of the triangle
			// 
function meshMaterial () {
   
    return new THREE.MeshLambertMaterial({ 
        color: 0xd9d9d9, 
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
    } );
} 

//
// Yields a proper material for drawing edges based on its type
//
function edgeMaterial (edge) {
    var edgeTypeColor = { 
        "Cut" : 0xff00000, 
        "Ridge" : 0x0ffff00, 
        "Valley" : 0x00ffff,
        "Flat" : 0x0000ff,
        "Border" : 0x777777
    };
    var material = new THREE.LineDashedMaterial({
        color: edgeTypeColor["Flat"], 
        scale:0.5, 
        linewidth:3, 
        dashSize: 2, 
        gapSize: 0
    });
    return material;
}
function createMeshModel (n,m,s) {
    
    // Create the halfedge mesh from an OBJ
    var hemesh = new Hemesh();
    //console.log(VertexGridtoThreeVector(GridMeshVertexArray));
    //.log(GridMeshFacesArray);
                
    hemesh.fromFaceVertex(GridMeshFacesArray,VertexGridtoThreeVector(GridMeshVertexArray));
    //hemesh.normalize();
    return hemesh;
}

			
			
			