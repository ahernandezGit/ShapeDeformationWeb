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


function VertexGridmesh(x,y,z,type,index){
    this.vertex=new THREE.Vector3(x, y, z);
    this.type=type;
    this.index=index;
}
function toThreeVector3(array){
    result=[];
    for(var i=0;i<array.length;i++){
        result.push(array[i].vertex);
    }
    return result;
}
function offsetZ(array,val){
    var result=[];
    var n=array.length;
    for(var i=0;i<n;i++){
        result.push(new THREE.Vector3(array[i].x, array[i].y, val));
    }
    return result;
}
function createMesh(faces,back,front){
    var m=back.length;
    var n=front.length;
    var fac=faces.slice();
    console.log(faces.length,m,n);
    var vtx=[];
    vtx=back.concat(front);
    for(var i=0;i<faces.length;i++){
        fac.push([faces[i][0]+m,faces[i][1]+m,faces[i][2]+m]);
    }
    console.log(fac.length,vtx.length);
    //for(var i=0;i<)
    return [fac,vtx];
}			

