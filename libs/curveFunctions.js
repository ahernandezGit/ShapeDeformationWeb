// Sketch curve onto the mesh in spirit like  
// A Sketch-Based Interface for Detail-Preserving Mesh Editing, Andrew Nealen , Olga Sorkine , Marc Alexa and Daniel Cohen-Or
function projectCurve(){
    var result=[];
    var result2=[];
    for(var i=0;i<arrayLineStroke.length;i++){
        var min=0;
        var d=1000;
        for(var j=0;j<arrayEdgeExtremesPathStroke.length;j++){
            var de=arrayLineStroke[i].distanceTo(hemesh.positions[arrayEdgeExtremesPathStroke[j]]);
            //console.log(de);
            if(de<d){
                min=j;
                d=de;
            }
        }
        if(result.length==0) result.push(min);
        else{
            if(result.indexOf(min)==-1){
               result.push(min);  
            } 
        }
    }
    /*//adding missing vertices
    for(var i=0;i<result.length-1;i++){
        if(hemesh.findHalfedge(arrayEdgeExtremesPathStroke[result[i]],arrayEdgeExtremesPathStroke[result[i+1]])>-1){
            result2.push(result[i]);
            result2.push(result[i+1]);
        }
        else{
            //finding "geodesic" walk betwen i and i+1 
            var faceIndex1=tableHashVFOfNewCurve[arrayEdgeExtremesPathStroke[result[i]].toString()];
            var faceIndex2=tableHashVFOfNewCurve[arrayEdgeExtremesPathStroke[result[i+1]].toString()];
            var element=-1;
            if(faceIndex1.length==1){
                if()
            } 
        }
    }
    */
    //Adding vertex to List of fixed Vertex
    ListOfCurvesGeometry.push(new THREE.Geometry());
    var extreme=FixedVertex.length+result.length-1;
    ListOfCurves.push([FixedVertex.length,extreme]);
    for(var i=0;i<result.length;i++){
        ListOfCurvesGeometry[ListOfCurvesGeometry.length-1].vertices.push(hemesh.positions[arrayEdgeExtremesPathStroke[result[i]]]);
        FixedVertex.push(arrayEdgeExtremesPathStroke[result[i]]);
    }
    
    //to screen space
    var screenResult=[];
    var screenStroke=[];
    var normalResult=[];
    for(var i=0;i<result.length;i++){
        normalResult.push(computeAverageNormal(arrayEdgeExtremesPathStroke[result[i]]));
        var vector2=threeToScreenSpace(hemesh.positions[arrayEdgeExtremesPathStroke[result[i]]].clone());
        screenResult.push(vector2);
    }
    for(var i=0;i<arrayLineStroke.length;i++){
        var vector2=threeToScreenSpace(arrayLineStroke[i].clone());
        screenStroke.push(vector2);
    }
    
    //projecting path aprox to screen stroke
    var projected3=[];
    var edgeGeometry = new THREE.Geometry();
    for(var i=0;i<screenResult.length;i++){
         var point=screenResult[i].clone();
         var d=100000;
         var project=new THREE.Vector2(point.x,point.y);
         //if(i>0 && i<screenResult.length-1){ 
             var i0=0;
             var ifinal=screenStroke.length;
             if(i-3>0) i0=i-3;
             if(i+3>screenStroke.length) ifinal=i+3; 
             for(var j=i0;j<ifinal-1;j++){
                // detecting near segement  to point
                var A=screenStroke[j].clone();
                var C=screenStroke[j+1].clone();
                var la=point.clone().sub(A).length();
                var lc=point.clone().sub(C).length(); 
                var lb=A.clone().sub(C).length();
                if(Math.pow(la,2)>Math.pow(lb,2)+Math.pow(lc,2)) continue;
                if(Math.pow(lc,2)>Math.pow(lb,2)+Math.pow(la,2)) continue; 

                //defining line that pass by j and j+1
                var start=screenStroke[j];
                var vector=point.clone();
                vector.sub(start); 
                var direction=screenStroke[j+1].clone().sub(screenStroke[j]).normalize();
                var directionclone=direction.clone(); 
                var projection=directionclone.multiplyScalar(vector.dot(direction));
                projection.add(start);
                var de=point.clone().sub(projection).length();
                if(de<d){
                    project.copy(projection);
                    d=de;
                } 
             }
             screenResult[i].copy(project);
         //}
         //screenResult[0].copy(screenStroke[0]);
         //screenResult[screenResult.length-1].copy(screenStroke[screenStroke.length-1]);
        //projecting projected path on the tangent plane of the path 
         var vector = new THREE.Vector3();
         var srx = ( screenResult[i].x / window.innerWidth ) * 2 - 1;
         var sry = - ( screenResult[i].y / window.innerHeight ) * 2 + 1;
         vector.set( srx ,sry , 0.5 );
         vector.unproject( setup.camera);
         var cameraposition=setup.camera.position.clone();
         var dir = vector.sub(cameraposition).normalize();
         //normalResult[i].multiplyScalar(-1);
         var copyResult3=hemesh.positions[arrayEdgeExtremesPathStroke[result[i]]].clone();
         edgeGeometry.vertices.push(copyResult3.clone(),copyResult3.clone().add(normalResult[i]));
         copyResult3.sub(cameraposition);
         var t=copyResult3.dot(normalResult[i])/dir.dot(normalResult[i]);
         var point3=cameraposition.add(dir.multiplyScalar(t));
         projected3.push(point3);
         copyResult3.copy(point3);
    }
    var material = new THREE.LineBasicMaterial( {color: 0x0015FF, linewidth: 2 } );
    var edge= new THREE.LineSegments(edgeGeometry,material);
    setup.scene.add(edge);    
    ListOfCurvesObject.push(new THREE.Line(ListOfCurvesGeometry[ListOfCurvesGeometry.length-1], materialSample));
    ListOfCurvesObject[ListOfCurvesObject.length-1].name="curve"+(ListOfCurvesObject.length-1).toString();
    setup.scene.add(ListOfCurvesObject[ListOfCurvesObject.length-1]);
    console.log("saindo project");
    console.log("ncurves",ListOfCurves.length);
    return projected3;
}
function verifyIntersectRay(intersects){
    if ( intersects.length > 0 ) {
            flagIntersectionMesh=true;
            var intersect = intersects[0];
            //var intersect1 = intersects[1];
            if(isAddingCurve){
                //console.log("entrei isaddingcurve");
                var a=intersect.face.a;
                var b=intersect.face.b;
                var c=intersect.face.c;
                if(faceArrayOfNewCurve.length==0){
                    faceArrayOfNewCurve.push(intersect.faceIndex);
                    arrayLineStroke.push(intersect.point);
                    arrayEdgeExtremesPathStroke.push(a);
                    arrayEdgeExtremesPathStroke.push(b);
                    arrayEdgeExtremesPathStroke.push(c);
                    tableHashVFOfNewCurve[a.toString()]=[intersect.faceIndex];
                    tableHashVFOfNewCurve[b.toString()]=[intersect.faceIndex];
                    tableHashVFOfNewCurve[c.toString()]=[intersect.faceIndex];
                    intersect.face.color.setRGB(20/256,144/256,175/256);
                    intersect.object.geometry.colorsNeedUpdate = true;
                }
                else if(faceArrayOfNewCurve[faceArrayOfNewCurve.length-1]!=intersect.faceIndex){
                    faceArrayOfNewCurve.push(intersect.faceIndex);
                    arrayLineStroke.push(intersect.point);
                    if(arrayEdgeExtremesPathStroke.indexOf(a)==-1){
                        arrayEdgeExtremesPathStroke.push(a);
                        tableHashVFOfNewCurve[a.toString()]=[intersect.faceIndex];
                    } 
                    else tableHashVFOfNewCurve[a.toString()].push(intersect.faceIndex);
                    if(arrayEdgeExtremesPathStroke.indexOf(b)==-1){
                        arrayEdgeExtremesPathStroke.push(b);
                        tableHashVFOfNewCurve[b.toString()]=[intersect.faceIndex];
                    } 
                    else tableHashVFOfNewCurve[b.toString()].push(intersect.faceIndex);
                    if(arrayEdgeExtremesPathStroke.indexOf(c)==-1){
                        arrayEdgeExtremesPathStroke.push(c);
                        tableHashVFOfNewCurve[c.toString()]=[intersect.faceIndex];
                    }
                    else tableHashVFOfNewCurve[c.toString()].push(intersect.faceIndex);
                    
                    //console.log(faceArrayOfNewCurve);
                    intersect.face.color.setRGB(20/256,144/256,175/256);
                    intersect.object.geometry.colorsNeedUpdate = true;
                    //intersect1.face.color.setRGB(20/256,144/256,175/256);
                    //intersect1.object.geometry.colorsNeedUpdate = true;
                    //mesh.geometry.colorsNeedUpdate=true;
                }
            }
           
   }
   else{
       flagIntersectionMesh=false;
   }
}
function computeAverageNormal(v){
    var h=hemesh.vertexHalfedge(v);
    var normal=new THREE.Vector3(0,0,0);
    var t=0;
    hemesh.vertexCirculator(function(he){
        //normal of one face
        var source=hemesh.halfedgeSource(he)
        var she=hemesh.halfedgeSinkCCW(he);
        var sv=hemesh.halfedgeSource(she);
        var a=hemesh.positions[source].clone().sub(hemesh.positions[v]);
        var b=hemesh.positions[sv].clone().sub(hemesh.positions[v]);
        var n=new THREE.Vector3();
        n.crossVectors( a, b );
        n.normalize();
        normal.add(n);
        t++;
    },h);
    normal.divideScalar(t);
    normal.normalize();
    return normal;
}
function threeToScreenSpace(v){
    var vector=v.project(setup.camera);
    vector.x = Math.round((vector.x + 1) / 2 * window.innerWidth);
    vector.y = Math.round(-(vector.y - 1) / 2 * window.innerHeight);
    return new THREE.Vector2(vector.x,vector.y);    
}


function ListVertexGeodesic(){
    this.vertices=[];
}
ListVertexGeodesic.prototype.addVertex=function(vertex){
    this.vertices.push(new VertexOfList(vertex));
}
ListVertexGeodesic.prototype.addFace=function (node){
    var index=this.vertices
}
function VertexOfList(vertex){
    this.vertex=vertex;
    this.faces=[];
}
VertexOfList.prototype.addFace=function(f){
    this.faces.push(f);
}