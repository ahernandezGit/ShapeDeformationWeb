// Yields a different mesh material depending on the number of 
			// the connected component of the triangle
			// 
function meshMaterial (component) {
    var colors = [0xffffff, 0xffaaff, 0xffffaa, 0xaaffff, 
                  0xaaaaff, 0xffaaaa, 0xaaffaa]; 
    return new THREE.MeshLambertMaterial({ 
        color: colors[5], 
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
function createPaperModel (n,m,s) {
				function iv (i,j) { return i*m+j };
				var fac = [], vtx = [];
				var x0 = -(n-1)*s/2;
				var y0 = -(m-1)*s/2
				for (var i = 0; i < n; i++) {
					for (var j = 0; j < m; j++) {
						vtx.push (new PVector (x0+i*s,y0+j*s,sizeGrid));
						if (i > 0 && j > 0) {
							fac.push ([iv(i-1,j-1), iv(i-1,j), iv(i,j)]);
							fac.push ([iv(i-1,j-1), iv(i,j), iv(i,j-1)]);
						}
					}
				}
				return new PaperModel(fac,vtx);
}

			
			
			