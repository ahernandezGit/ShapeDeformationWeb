// Sketch curve onto the mesh in spirit like  
// A Sketch-Based Interface for Detail-Preserving Mesh Editing, Andrew Nealen , Olga Sorkine , Marc Alexa and Daniel Cohen-Or
function projectCurve(){
    var result=[];
    var result2=[];
    var isclosed=false;
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
    //adding missing vertices
    for(var i=0;i<result.length-1;i++){
        if(hemesh.findHalfedge(arrayEdgeExtremesPathStroke[result[i]],arrayEdgeExtremesPathStroke[result[i+1]])>-1){
            if(result2.length==0) result2.push(result[i]);
            result2.push(result[i+1]);
        }
        else{
            //finding "geodesic" walk betwen i and i+1 
            var h1=hemesh.vertexHalfedge(arrayEdgeExtremesPathStroke[result[i]]);
            var h2=hemesh.vertexHalfedge(arrayEdgeExtremesPathStroke[result[i+1]]);
            var neibor=[];
            var found=[];
            hemesh.vertexCirculator(function(he){
                neibor.push(hemesh.halfedgeSource(he));
            },h1);
            hemesh.vertexCirculator(function(he){
                var src=hemesh.halfedgeSource(he);
                if(neibor.indexOf(src)==-1){
                    neibor.push(src);
                }
                else{
                  found.push(src);    
                } 
            },h2);
            if(result2.length==0) result2.push(result[i]);
            if(found.length==1) result2.push(arrayEdgeExtremesPathStroke.indexOf(found[0])); 
            else if(found.length==2){
               var d1=hemesh.positions[found[0]].distanceTo(hemesh.positions[arrayEdgeExtremesPathStroke[result[i]]])+hemesh.positions[found[0]].distanceTo(hemesh.positions[arrayEdgeExtremesPathStroke[result[i+1]]]);
                
               var d2=hemesh.positions[found[1]].distanceTo(hemesh.positions[arrayEdgeExtremesPathStroke[result[i]]])+hemesh.positions[found[1]].distanceTo(hemesh.positions[arrayEdgeExtremesPathStroke[result[i+1]]]); 
                
               if(d1<d2) result2.push(arrayEdgeExtremesPathStroke.indexOf(found[0]));   
               else result2.push(arrayEdgeExtremesPathStroke.indexOf(found[1]));       
            } 
            console.log(found);
            console.log(arrayEdgeExtremesPathStroke.indexOf(found[0]));
            result2.push(result[i+1]);
        }
    }
    if(hemesh.findHalfedge(arrayEdgeExtremesPathStroke[result2[0]],arrayEdgeExtremesPathStroke[result2[result2.length-1]])>-1){
        isclosed=true;
    }
    result=result2;
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
    //var edgeGeometry = new THREE.Geometry();
    var m=screenStroke.length;
    for(var i=0;i<screenResult.length;i++){
         var point=screenResult[i].clone();
         var d=10000000;
         var project=new THREE.Vector2(point.x,point.y);
         var ip=-1;
         for(var j=0;j<m-1;j++){
            // detecting near segement  to point
            var ss=screenStroke[j].clone();
            var distance=point.distanceTo(ss);
            if(distance<d){
                d=distance;
                ip=j;
            } 
         }
         var ipm=ip-1;
         var ips=ip+1;
         var indexes=[];
         //analyse before and follow segment to ip
         if(ip-1>-1) indexes.push(ip-1);
         indexes.push(ip);
         if(ip+1<screenStroke.length) indexes.push(ip+1);
         
         for(var j=0;j<indexes.length-1;j++){
            var A=screenStroke[indexes[j]].clone();
            var C=screenStroke[indexes[j+1]].clone();
            var la=point.clone().sub(A).length();
            var lc=point.clone().sub(C).length(); 
            var lb=A.clone().sub(C).length();
            var s=(la+lb+lc)/2;
            var area=Math.sqrt(s*(s-la)*(s-lb)*(s-lc));
            var distance=2*area/lb;
            if(distance<d){
                d=distance;
                ip=indexes[j];
            }
         } 
         if(indexes.length==3){
            var A=screenStroke[indexes[0]].clone();
            var B=screenStroke[indexes[1]].clone();
            var C=screenStroke[indexes[2]].clone();
            var pa=A.sub(B);
            var pc=C.sub(B);; 
            var pb=point.clone().sub(B);
            if(pa.dot(pb)<0 && pc.dot(pb)<0) ip=indexes[1];    
         }
         
        //defining line that pass by ip and ip+1
            var start=screenStroke[ip];
            var vector=point.clone();
            vector.sub(start); 
            var direction=screenStroke[ip+1].clone().sub(screenStroke[ip]).normalize();
            var directionclone=direction.clone(); 
            var projection=directionclone.multiplyScalar(vector.dot(direction));
            projection.add(start);
            
         screenResult[i].copy(projection);
         
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
         var copyResult3=hemesh.positions[arrayEdgeExtremesPathStroke[result[i]]];
         //edgeGeometry.vertices.push(copyResult3.clone(),copyResult3.clone().add(normalResult[i]));
         copyResult3.sub(cameraposition);
         var t=copyResult3.dot(normalResult[i])/dir.dot(normalResult[i]);
         var point3=cameraposition.add(dir.multiplyScalar(t));
         projected3.push(point3);
         copyResult3.copy(point3);
    }
    //Adding vertex to List of fixed Vertex
    ListOfCurvesGeometry.push(new THREE.Geometry());
    var extreme=FixedVertex.length+result.length-1;
    ListOfCurves.push([FixedVertex.length,extreme]);
    var arrayIndexCurve=[];
    var laplacianCotan=[];
    for(var i=0;i<result.length;i++){
        ListOfCurvesGeometry[ListOfCurvesGeometry.length-1].vertices.push(hemesh.positions[arrayEdgeExtremesPathStroke[result[i]]]);
        arrayIndexCurve.push(arrayEdgeExtremesPathStroke[result[i]]);
        laplacianCotan.push(LaplacianCotangent(arrayEdgeExtremesPathStroke[result[i]]));
        FixedVertex.push(arrayEdgeExtremesPathStroke[result[i]]);
    }
    if(isclosed) ListOfCurvesGeometry[ListOfCurvesGeometry.length-1].vertices.push(hemesh.positions[arrayEdgeExtremesPathStroke[result[0]]]);
    //var material = new THREE.LineBasicMaterial( {color: 0x0015FF, linewidth: 2 } );
    //var edge= new THREE.LineSegments(edgeGeometry,material);
    //relaxingVertices(arrayIndexCurve,laplacianCotan);
    relaxingVertices(arrayIndexCurve,laplacianCotan);
    //setup.scene.add(edge);    
    ListOfCurvesObject.push(new THREE.Line(ListOfCurvesGeometry[ListOfCurvesGeometry.length-1], materialSample));
    ListOfCurvesObject[ListOfCurvesObject.length-1].name="curve"+(ListOfCurvesObject.length-1).toString();
    setup.scene.add(ListOfCurvesObject[ListOfCurvesObject.length-1]);
    console.log("saindo project");
    console.log("ncurves",ListOfCurves.length);
    return projected3;
}
function projectToCameraPlane(event){
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;		
    //console.log(mouse);
    var vector = new THREE.Vector3();
    vector.set( mouse.x ,mouse.y , -0.9 );
   // console.log("vector antes ", vector);
    vector.unproject( setup.camera);
    vector.sub(setup.camera.position);
    vector.copy(setup.camera.position.clone().add(vector));
    return vector;
}
function verifyIntersectRay(intersects){
    if ( intersects.length > 0 ) {
            flagIntersectionMesh=true;
            var intersect = intersects[0];
            var intersect1 = intersects[1];
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
                    //intersect.face.color.setRGB(20/256,144/256,175/256);
                    //intersect.object.geometry.colorsNeedUpdate = true;
                    
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
                    //intersect.face.color.setRGB(20/256,144/256,175/256);
                    //intersect.object.geometry.colorsNeedUpdate = true;
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

//just consider two intersections
function verifyIntersectRay2(intersects){
    if ( intersects.length > 0 ) {
            flagIntersectionMesh=true;
            var intersect = intersects[0];
            if(intersects.length>1) var intersect1 = intersects[1];
            else console.log("non secnds intersect");
            if(isAddingCurve){
                //console.log("entrei isaddingcurve");
                var a=intersect.face.a;
                var b=intersect.face.b;
                var c=intersect.face.c;
                if(intersects.length>1){
                    var d=intersect1.face.a;
                    var e=intersect1.face.b;
                    var f=intersect1.face.c;
                }
                if(faceArrayOfNewCurve.length==0){
                    faceArrayOfNewCurve.push(intersect.faceIndex);
                    arrayLineStroke.push(intersect.point);
                    arrayEdgeExtremesPathStroke.push(a);
                    arrayEdgeExtremesPathStroke.push(b);
                    arrayEdgeExtremesPathStroke.push(c);
                    tableHashVFOfNewCurve[a.toString()]=[intersect.faceIndex];
                    tableHashVFOfNewCurve[b.toString()]=[intersect.faceIndex];
                    tableHashVFOfNewCurve[c.toString()]=[intersect.faceIndex];
                    
                    //intersect.face.color.setRGB(20/256,144/256,175/256);
                    //intersect.object.geometry.colorsNeedUpdate = true;
                }
                else if(faceArrayOfNewCurve.indexOf(intersect.faceIndex)==-1){
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
                if(intersects.length>1){
                      if(faceArrayOfNewCurveBS.length==0){
                        faceArrayOfNewCurveBS.push(intersect1.faceIndex);
                        arrayLineStrokeBS.push(intersect1.point);
                        arrayEdgeExtremesPathStrokeBS.push(d);
                        arrayEdgeExtremesPathStrokeBS.push(e);
                        arrayEdgeExtremesPathStrokeBS.push(f);

                        //intersect.face.color.setRGB(20/256,144/256,175/256);
                        //intersect.object.geometry.colorsNeedUpdate = true;
                      }
                      else if(faceArrayOfNewCurveBS.indexOf(intersect1.faceIndex)==-1){  
                            faceArrayOfNewCurveBS.push(intersect1.faceIndex);
                            arrayLineStrokeBS.push(intersect1.point);
                            if(arrayEdgeExtremesPathStrokeBS.indexOf(d)==-1){
                                arrayEdgeExtremesPathStrokeBS.push(d);
                            } 
                            if(arrayEdgeExtremesPathStrokeBS.indexOf(e)==-1){
                                arrayEdgeExtremesPathStrokeBS.push(e);
                            }
                            if(arrayEdgeExtremesPathStrokeBS.indexOf(f)==-1){
                                arrayEdgeExtremesPathStrokeBS.push(f);
                            }
                            intersect1.face.color.setRGB(20/256,144/256,175/256);
                            intersect1.object.geometry.colorsNeedUpdate = true;
                      }
                }
            }
           
   }
   else{
       flagIntersectionMesh=false;
   }
}    
function concatBackSide(){
    faceArrayOfNewCurveBS.reverse();
    arrayLineStrokeBS.reverse();
    arrayEdgeExtremesPathStrokeBS.reverse();
    for(var i=0;i<faceArrayOfNewCurveBS.length;i++){
        if(faceArrayOfNewCurve.indexOf(faceArrayOfNewCurveBS[i])==-1){
           faceArrayOfNewCurve.push(faceArrayOfNewCurveBS[i]);
           arrayLineStroke.push(arrayLineStrokeBS[i]);
           var vertices=hemesh.faceVertices(faceArrayOfNewCurveBS[i]);
            if(arrayEdgeExtremesPathStroke.indexOf(vertices[0])==-1){
                arrayEdgeExtremesPathStroke.push(vertices[0]);
            } 
            if(arrayEdgeExtremesPathStroke.indexOf(vertices[1])==-1){
                arrayEdgeExtremesPathStroke.push(vertices[1]);
            }
            if(arrayEdgeExtremesPathStroke.indexOf(vertices[2])==-1){
                arrayEdgeExtremesPathStroke.push(vertices[2]);
            }       
        }
    }
}
function relaxingVertices(curveIndex,lapla){
    /*
    //defining linear system
    var totalVertices=[];
    var tableHash=[];
    //neibor of curveIndex[i]
    var listOfNeibor=[];
    for(var i=0;i<curveIndex.length;i++){
        var h=hemesh.vertexHalfedge(curveIndex[i]);
        tableHash[curveIndex[i].toString()]=totalVertices.length;
        totalVertices.push(curveIndex[i]);
        listOfNeibor[curveIndex[i].toString()]=[];
        hemesh.vertexCirculator(function(he){
            var index=hemesh.halfedgeSource(he);
            if(totalVertices.indexOf(index)==-1){
                tableHash[index.toString()]=totalVertices.length;
                totalVertices.push(index);
                listOfNeibor[curveIndex[i].toString()].push(totalVertices.length-1);    
            }
        },h);
    }
    console.log(totalVertices);
    var n=curveIndex.length;
    var A=zeros(n+totalVertices.length+n-2,totalVertices.length);
    console.log("dimensoes",n+totalVertices.length+n-2,totalVertices.length);
    var bx=zeros(n+totalVertices.length+n-2);
    var by=zeros(n+totalVertices.length+n-2);
    var bz=zeros(n+totalVertices.length+n-2);
    for(var i=0;i<n;i++){
        A.val[i*A.n+i]=1;    
        var neibors=listOfNeibor[curveIndex[i].toString()];
        for(var j=0;j<neibors.length;j++){
            A.val[i*A.n+neibors[j]]=-1/neibors.length;              
        }
        bx[i]=lapla[i].x;
        by[i]=lapla[i].y;
        bz[i]=lapla[i].z;
    }
    var wel=100;
    var wol=0.01;
    for(var i=n;i<n+totalVertices.length;i++){
        if(curveIndex.indexOf(totalVertices[i-n])!=-1){
            A.val[i*A.n+i-n]=wel;
            bx[i]=wel*hemesh.positions[totalVertices[i-n]].x;
            by[i]=wel*hemesh.positions[totalVertices[i-n]].y;
            bz[i]=wel*hemesh.positions[totalVertices[i-n]].z;    
        }
        else{
            A.val[i*A.n+i-n]=wol;
            bx[i]=wel*hemesh.positions[totalVertices[i-n]].x;
            by[i]=wel*hemesh.positions[totalVertices[i-n]].y;
            bz[i]=wel*hemesh.positions[totalVertices[i-n]].z;  
        }
        
    }
    for(var i=n+totalVertices;i<totalVertices.length+2*n-2;i++){
        var ic=tableHash[curveIndex[i-n-totalVertices.length+1].toString()];
        var ic0=tableHash[curveIndex[i-n-totalVertices.length].toString()];
        var ic1=tableHash[curveIndex[i-n-totalVertices.length+2].toString()];
        A.val[i*A.n+ic]=1;
        A.val[i*A.n+ic0]=-0.5;
        A.val[i*A.n+ic1]=-0.5;
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
          for (var i=0;i<totalVertices.length;i++){
              hemesh.positions[totalVertices[i]].setX(result[i]);
          }
          console.log(result);
          flaglabx=true;
          //console.log(flaglabx);
          labx.close();
    });	
    laby.getObject("vy", function ( result ) { // recover the value of a variable from the lab
        for (var i=0;i<totalVertices.length;i++){
              hemesh.positions[totalVertices[i]].setY(result[i]);
        }
        console.log(result);
        flaglaby=true;
        //console.log(flaglaby);
        laby.close();
    });
    labz.getObject("vz", function ( result ) { // recover the value of a variable from the lab
        for (var i=0;i<totalVertices.length;i++){
              hemesh.positions[totalVertices[i]].setZ(result[i]);
        }
        console.log(result);
        flaglabz=true;
        //console.log(flaglabz);
        labz.close();
    });
    //setTimeout(updateRenderMesh,100);
    */
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
            var id=curveIndex.indexOf(i);
            if(id!=-1){
                bx[i]=lapla[id].x;
                by[i]=lapla[id].y;
                bz[i]=lapla[id].z;    
            }
            else{
                bx[i]=laplaCotan[i].x;
                by[i]=laplaCotan[i].y;
                bz[i]=laplaCotan[i].z;
            }
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
    console.log("relaxing ");
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