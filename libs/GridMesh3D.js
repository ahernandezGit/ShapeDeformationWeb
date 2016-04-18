mesh={};

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
    //console.log(fac.length,vtx.length);
    //for(var i=0;i<)
    return [fac,vtx];
}	

// input is the vertex and faces if the plane triangulate stroke  
function createMesh2(){
    var r=pointSample.length;
    var n=gridBoundary.length;
    var interiorPointsNumber=GridMeshVertexArray.length-r;
    var totalPoints=GridMeshVertexArray.length;
    var vtx=toThreeVector3(GridMeshVertexArray.slice()); 
    var vtx2=[];
    for(var i=0;i<interiorPointsNumber;i++){
        vtx2.push(new THREE.Vector3(vtx[i].x,vtx[i].y,parseFloat(-sizeGrid)));
    }
    for(var i=0;i<interiorPointsNumber;i++){
        //console.log(i,parseFloat(sizeGrid));
        vtx[i].setZ(parseFloat(sizeGrid));
    }

    vtx=vtx.concat(vtx2);
    var fac=GridMeshFacesArray.slice();
    for(var i=0;i<GridMeshFacesArray.length;i++){
        var current=GridMeshFacesArray[i].slice();
        current.reverse();
        for(var j=0;j<3;j++){
           if(current[j]<interiorPointsNumber){
               current[j]+=totalPoints;
           }   
        }
        fac.push(current);
    }
    for(i=totalPoints-1;i>=interiorPointsNumber;i=i-1){
        FixedVertex.push(i);
    }
    FixedVertex.reverse();
    return [fac,vtx];
}

