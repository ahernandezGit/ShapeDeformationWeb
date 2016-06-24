function projectCurve(){
    //var curve=new THREE.CatmullRomCurve3(arrayLineStroke);
    //var numberPoints=faceArrayOfNewCurve.length;
    //arrayLineStroke=curve.getSpacedPoints(numberPoints-1);
    //console.log(arrayEdgeExtremesPathStroke);
    //console.log(arrayLineStroke);
    //var stack=arrayEdgeExtremesPathStroke.slice();
    //stack.reverse();
    var result=[];
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
            if(result.indexOf(min)==-1) result.push(min);
        }
    }
    //to screen space
    var screenResult=[];
    var screenStroke=[];
    var normalResult=[];
    for(var i=0;i<result.length;i++){
        normalResult.push(LaplacianCotangent(arrayEdgeExtremesPathStroke[result[i]]).normalize());
        var vector2=threeToScreenSpace(hemesh.positions[arrayEdgeExtremesPathStroke[result[i]]].clone());
        screenResult.push(vector2);
    }
    for(var i=0;i<arrayLineStroke.length;i++){
        var vector2=threeToScreenSpace(arrayLineStroke[i].clone());
        screenStroke.push(vector2);
    }
    
    //projecting path aprox to screen stroke
    var projected3=[];
    for(var i=0;i<screenResult.length;i++){
         var point=screenResult[i].clone();
         var d=100000;
         var project=new THREE.Vector2(0,0);
         for(var j=0;j<screenStroke.length-1;j++){
            //defining line that pass by j and j+1
            var start=screenStroke[j];
            point.sub(start); 
            var direction=screenStroke[j+1].clone().sub(screenStroke[j]).normalize();
            var directionclone=direction.clone(); 
            var projection=directionclone.multiplyScalar(point.dot(direction));
            projection.add(start);
            var de=point.clone().sub(projection).length();
            if(de<d){
                project.copy(projection);
                d=de;
            } 
         }
         screenResult[i].copy(project);
         
        //projecting projected path on the tangent plane of the path 
         var vector = new THREE.Vector3();
         var srx = ( screenResult[i].x / window.innerWidth ) * 2 - 1;
         var sry = - ( screenResult[i].y / window.innerHeight ) * 2 + 1;
         vector.set( srx ,sry , 0.5 );
         vector.unproject( setup.camera);
         var cameraposition=setup.camera.position.clone();
         var dir = vector.sub(cameraposition).normalize();
         normalResult[i].multiplyScalar(-1);
         var copyResult3=hemesh.positions[arrayEdgeExtremesPathStroke[result[i]]].clone();
         copyResult3.sub(cameraposition);
         var t=copyResult3.dot(normalResult[i])/dir.dot(normalResult[i]);
         var point3=cameraposition.add(dir.multiplyScalar(t));
         projected3.push(point3);
    }
    
    console.log("saindo project");
    return projected3;
}
function threeToScreenSpace(v){
    var vector=v.project(setup.camera);
    vector.x = Math.round((vector.x + 1) / 2 * window.innerWidth);
    vector.y = Math.round(-(vector.y - 1) / 2 * window.innerHeight);
    return new THREE.Vector2(vector.x,vector.y);    
}