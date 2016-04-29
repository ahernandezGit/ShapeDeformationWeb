// array of index(in vertexAdjacency array) from the constrain vertex 
var FixedVertex=[];
var L={};
var Ac={};
var AcT={};
var invAcTAc={};
var First_Ac={};
var First_AcT={};
var First_invAcTAc={};

//var FreeVertex=[];

//Mean Curvature of one vertex (index v) by cotangent formula
//input array index of the halfedge positions array
function meanCurvaturesCurveCotangent(v){
       var hs = hemesh.vertexHalfedge(v);
       var vetor=new THREE.Vector3(0.0, 0.0, 0.0);  
       var area=0;
       //var edgeGeometry = new THREE.Geometry();
       hemesh.vertexCirculator(function(he){
           var h2=hemesh.halfedgeNext(he);
           var h4=hemesh.halfedgeOpposite(hemesh.halfedgeSinkCCW(he));
           var face=hemesh.halfedgeFace(he);
           if(h2>-1 && h4>-1){
               var h3 = hemesh.halfedgeNext(h2); 
               var h5 = hemesh.halfedgeNext(h4);  
               var u = hemesh.halfedgeDirection(h3);
               var v = hemesh.halfedgeDirection(hemesh.halfedgeOpposite(h2));
               var uo = hemesh.halfedgeDirection(h5);
               var vo = hemesh.halfedgeDirection(hemesh.halfedgeOpposite(h4));
               var cotansum=u.dot(v)/u.clone().cross(v).length()+uo.dot(vo)/uo.clone().cross(vo).length();
               cotansum=-0.5*cotansum;
               var pjpi=hemesh.halfedgeDirection(he);
               vetor.add(pjpi.multiplyScalar(cotansum));
           }
           area+=hemesh.faceArea(face);
       },hs);
       area=area/3;
       vetor.divideScalar(area);
       //edgeGeometry.vertices.push(hemesh.positions[v],hemesh.positions[v].clone().add(vetor).multiplyScalar(0.5));
       //var material = new THREE.LineBasicMaterial( {color: 0x27B327, linewidth: 2 } );
       //var edge=new THREE.Line(edgeGeometry,material);
       //setup.scene.add(edge);
   return 0.25*vetor.length();    
}

function CurvatureVertexPlane(lvertex,vertex,rvertex){
        var v1=vertex.clone().sub(lvertex);
        var v2=rvertex.clone().sub(vertex)
        var mod1=v1.length();
        var mod2=v2.length();
        var angle= Math.acos(v1.dot(v2)/(mod1*mod2));
        //console.log(Math.sin(angle));
        return (4*Math.sin(angle/2)/(mod1+mod2));
}

//input: array of index in  VertexAdjacency
function FirstCurvaturesCurve(){
     var n=FixedVertex.length;
     var result=[Math.abs(CurvatureVertexPlane(hemesh.positions[FixedVertex[n-1]],hemesh.positions[FixedVertex[0]],hemesh.positions[FixedVertex[1]]))];
     for(var i=1;i<n;i++){
         result.push(Math.abs(CurvatureVertexPlane(hemesh.positions[FixedVertex[i-1]],hemesh.positions[FixedVertex[i]],hemesh.positions[FixedVertex[(i+1)%n]])));
     }
     return result;
}
function FirstCurvaturesCurve2(){
    var n=FixedVertex.length;
    var result=[];
    for(var i=0;i<n;i++){
        result.push(meanCurvaturesCurveCotangent(FixedVertex[i]));
    }
    //console.log(result);
    return result;
}

//Laplacian for all vertex vertex
function uniformLaplacian(){
    var n=hemesh.positions.length;
    
    var L=zeros(n,n);
    var result=[];
    for(var i=0;i<n;i++){
        //result.push(hemesh.vertexValence(i));
        L.val[i*L.n+i]=1.0;    
        var h=hemesh.vertexHalfedge(i);
        var di=hemesh.vertexValence(i);
        hemesh.vertexCirculator(function(he){
            var j=hemesh.halfedgeSource(he);
            L.val[i*n+j]=-1/di;    
        },h);    
    }
    console.log("Laplacian finish");
    return sparse(L);
}
function matrixtoProcessCurvatureEdgeLength(){
    var n=hemesh.positions.length;
    var fL=full(L);
    var A=zeros(2*n,n);
    for(var i=n;i<2*n;i++){
        // 1.0 for fixed vertices
        if(FixedVertex.indexOf(i-n)!=-1){      
              A.val[i*A.n+i-n]=1.0;       
        }
        else{
            // use 0.1 for free vertices
            A.val[i*A.n+i-n]=0.1;           
        }
    }
    for(var i=0;i<n;i++){
        for(var j=0;j<n;j++){
            A.val[i*n+j]=fL.val[i*n+j];       
        }  
    }
    Ac=sparse(A);
    AcT=transposespMatrix(Ac);  
    var AtA=mulspMatrixspMatrix(AcT,Ac);
    invAcTAc=inv(AtA);
}
function FirstMatrixtoProcessCurvatureEdgeLength(){
    var n=hemesh.positions.length;
    var fL=full(L);
    var m=n+FixedVertex.length;
    var A=zeros(m,n);
    for(var i=n;i<m;i++){
        A.val[i*A.n+FixedVertex[i-n]]=1.0;            
    }
    for(var i=0;i<n;i++){
        for(var j=0;j<n;j++){
            A.val[i*n+j]=fL.val[i*n+j];       
        }
    }
    First_Ac=sparse(A);
    First_AcT=transposespMatrix(First_Ac);
    var AtA=mulspMatrixspMatrix(First_AcT,First_Ac);
    var QR=qr(AtA,true);
    First_invAcTAc=inv(AtA);
}

function FisrtIterationCurvaturesProcess(){
    var n=hemesh.positions.length;
    var m=n+FixedVertex.length;
    var b=zeros(m);
    var bconstrain=FirstCurvaturesCurve2();
    for(var i=n;i<m;i++){
        b[i]=bconstrain[i-n];
    }
    //var c=cgnr(A,b);
    //console.log("First cuvature iteration finish");
    //console.log(c.length);
    /*
    var At=transposeMatrix(A);
    var AtA=mulMatrixMatrix(At,A);
    var c2=mulMatrixVector(inv(AtA),mulMatrixVector(At,b));
    var svdL = svd(A, "full");
    var bp=mulMatrixVector(transposeMatrix(svdL.U),b);
    var y=getSubVector(bp, range(0,n) );
    var d=svdL.s;
    //console.log("diagonal ",d);
    y=divVectors(y,d);
    var c3= mulMatrixVector(svdL.V,y);
    console.log("normal ", norm(subVectors(c2,c)));
    console.log("svd ",norm(subVectors(c3,c)));
    console.log("comprovation finish");
    return c2;
    */
    
    var c=mulMatrixVector(First_invAcTAc,mulspMatrixVector(First_AcT,b));
    return c;
}
//weights were advice of Andrew Nealen
function IterationCurvaturesProcess(cc){
    var n=L.n;
    var b=zeros(2*n);
    for(var i=n;i<2*n;i++){
        // 1.0 for fixed vertices
        if(FixedVertex.indexOf(i-n)!=-1){
              b[i]=cc[i-n];       
        }
        else{
            // use 0.1 for free vertices
            b[i]=0.1*cc[i-n];
        }
        
    }
    //var c=cgnr(A,b);
    var c=mulMatrixVector(invAcTAc,mulspMatrixVector(AcT,b));
    console.log(c.length);
    return c;
}
function computeAverageEdgeLength(){
    var n=hemesh.positions.length;
    var result=[];
    for(var i=0;i<n;i++){
        var h=hemesh.vertexHalfedge(i);
        var ael=0;
        var val=0;
        hemesh.vertexCirculator(function(he){
            var ohe=hemesh.halfedgeOpposite(he);
            var vohe=hemesh.halfedgeVertex(ohe);
            var len=hemesh.positions[i].clone().sub(hemesh.positions[vohe]).length();
            ael=ael+len;
            val++;
        },h);
        ael=ael/val;
        result.push(ael);
    }
    return result;
}
function FisrtIterationEdgeLength(){
    var n=L.n;
    var m=n+FixedVertex.length;
    //var fL=full(L);
    //var A=zeros(m,n);
    var b=zeros(m);
    var bconstrain= mulScalarVector(lengthPointSample/pointSample.length,ones(m-n));
    //console.log(bconstrain);
    for(var i=n;i<m;i++){
        b[i]=bconstrain[i-n];
       //A.val[i*A.n+FixedVertex[i-n]]=1.0;
    }
   
    //var el=cgnr(A,b);
    //console.log(c.length);
    var el=mulMatrixVector(First_invAcTAc,mulspMatrixVector(First_AcT,b));
    First_Ac={};
    First_AcT={};
    First_invAcTAc={};
    console.log("First edge iteration finish");
    return el;
}
//weight was advice from Andrew Nealen
function IterationEdgeLength(el){
    var n=L.n;
    //var fL=full(L);
    //var A=zeros(2*n,n);
    var b=zeros(2*n);
    for(var i=n;i<2*n;i++){
        // 1.0 for fixed vertices
        if(FixedVertex.indexOf(i-n)!=-1){
              b[i]=el[i-n];     
              //A.val[i*A.n+i-n]=1.0;    
        }
        else{
            // use 0.1 for free vertices
            b[i]=0.1*el[i-n];
            //A.val[i*A.n+i-n]=0.1;
        }
    }
    //var el=cgnr(A,b);
    var el=mulMatrixVector(invAcTAc,mulspMatrixVector(AcT,b));
    console.log(el.length);
    return el;
}
function computeEdgeVector(edgeLength){
    var n=FixedVertex.length;
    function eta(i,j,v){
        this.i=i;
        this.j=j;
        this.vector=v;
    }
    var resultij=[];
    var result=[];
    //var edgeGeometry = new THREE.Geometry();
    //var material = new THREE.LineBasicMaterial( {color: 0xff2222, linewidth: 2 } );
    //var edgeLength=computeAverageEdgeLength();
    for(var i=0;i<n;i++){
        var h=hemesh.vertexHalfedge(FixedVertex[i]);
        var a=FixedVertex[i];
        hemesh.vertexCirculator(function(he){
            var j=hemesh.halfedgeSource(he);
            resultij.push([a,j]);
        },h);
    }
    for(var i=0;i<resultij.length;i++){
        var s=(edgeLength[resultij[i][0]]+edgeLength[resultij[i][1]])/2;
        var v=hemesh.positions[resultij[i][0]].clone().sub(hemesh.positions[resultij[i][1]]);
        v.normalize();
        v.multiplyScalar(s);
        result.push(new eta(resultij[i][0],resultij[i][1],v));
        //edgeGeometry.vertices.push(hemesh.positions[resultij[i][1]],hemesh.positions[resultij[i][1]].clone().add(v));
    }
    //var edge=new THREE.LineSegments(edgeGeometry,material);
    //setup.scene.add(edge); 
    console.log("compute edge vector finish");
    return result;
}
function computeIntegratedLaplacian(curvature){
    
    var n=curvature.length;
    var result=[];    
    //var edgeGeometry = new THREE.Geometry();
    //var material = new THREE.LineBasicMaterial( {color: 0xff2222, linewidth: 2 } );
    for(var i=0;i<n;i++){
        //compute Ai and ni
        var area=0;
        var normal=new THREE.Vector3(0,0,0);
        var h=hemesh.vertexHalfedge(i);
        var t=0;
        hemesh.vertexCirculator(function(he){
            var face=hemesh.halfedgeFace(he);
            var verts=hemesh.faceVertices(face);
            var c = new THREE.Vector3();
            area+=hemesh.faceArea(face);
            c.crossVectors(hemesh.positions[verts[2]].clone().sub(hemesh.positions[verts[0]]),hemesh.positions[verts[1]].clone().sub(hemesh.positions[verts[0]]));
            c.normalize();
            normal.add(c);
            t++;
        },h);
        area=area/3;
        normal.normalize();
        //compute laplacian i
        var laplaciani=normal.multiplyScalar(area*curvature[i]);
        result.push(laplaciani);
        //edgeGeometry.vertices.push(hemesh.positions[i],hemesh.positions[i].clone().add(laplaciani));
           
    }
    //var edge=new THREE.LineSegments(edgeGeometry,material);
    //setup.scene.add(edge); 
    console.log("compute integrated laplacian finish");
    return result;
}

//weight was advice from Andrew Nealen
function IterationUpdateVector(lapla,etaarray){
    var n=lapla.length;
    var fL=full(L);
    var m=etaarray.length;
    var r=FixedVertex.length;
    var A=zeros(n+r+m,n);
    var b=zeros(n+r+m,3);
    for(var i=0;i<n;i++){
        for(var j=0;j<n;j++){
            A.val[i*A.n+j]=fL.val[i*L.n+j];       
        }
        b.val[3*i]=lapla[i].x;
        b.val[3*i+1]=lapla[i].y;
        b.val[3*i+2]=lapla[i].z;
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
    var wel=0.01;
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
    var AT=transposespMatrix(spA);  
    var AtA=mulspMatrixspMatrix(AT,spA);
    var invATA=inv(AtA);
1
    var labx = new Lalolab("laloxname",false,"libs/lalolib") ; 
    var laby = new Lalolab("laloyname",false,"libs/lalolib") ; 
    var labz = new Lalolab("lalozname",false,"libs/lalolib") ; 
    labx.load(AT, "AT"); 
    labx.load(invATA, "invATA"); 
    labx.load(bx, "bx");
    laby.load(AT, "AT"); 
    laby.load(invATA, "invATA"); 
    laby.load(by, "by");
    labz.load(AT, "AT"); 
    labz.load(invATA, "invATA"); 
    labz.load(bz, "bz");
    labx.exec("vx= mulMatrixVector(invATA,mulspMatrixVector(AT,bx))");	
    laby.exec("vy= mulMatrixVector(invATA,mulspMatrixVector(AT,by))");	
    labz.exec("vz= mulMatrixVector(invATA,mulspMatrixVector(AT,bz))");	
    flaglabx=false;
    flaglaby=false;
    flaglabz=false;
    labx.getObject("vx", function ( result ) { // recover the value of a variable from the lab
          for (var i=0;i<n;i++){
              hemesh.positions[i].setX(result[i]);
          }
          console.log(result[0]);
          //console.log(result);
          flaglabx=true;
          console.log(flaglabx);
          labx.close();
    });	
    laby.getObject("vy", function ( result ) { // recover the value of a variable from the lab
        for (var i=0;i<n;i++){
              hemesh.positions[i].setY(result[i]);
        }
        console.log(result[0]);
        flaglaby=true;
        //console.log(result);
        console.log(flaglaby);
        laby.close();
    });
    labz.getObject("vz", function ( result ) { // recover the value of a variable from the lab
        for (var i=0;i<n;i++){
              hemesh.positions[i].setZ(result[i]);
        }
        console.log(result[0]);
        flaglabz=true;
        console.log(flaglabz);
        //console.log(result);
        labz.close();
    });
    //console.log(vx,vy,vz);
    /*var vx=mulMatrixVector(invATA,mulspMatrixVector(AT,bx));
    var vy=mulMatrixVector(invATA,mulspMatrixVector(AT,by));
    var vz=mulMatrixVector(invATA,mulspMatrixVector(AT,bz));
    for (var i=0;i<n;i++){
        hemesh.positions[i].set(vx[i],vy[i],vz[i]);
        //hemesh.moveVertexTo(i, new THREE.Vector3(vx[i], vy[i], vz[i]));
    }
    */
    console.log("update vertex finish");
    
}
function updateRenderMesh(){
    if(flaglabx && flaglaby && flaglabz){
        var mesh=setup.scene.getObjectByName("mesh");

        var wireframe=setup.scene.getObjectByName("wireframe");

        mesh.geometry.verticesNeedUpdate = true;

        setup.scene.remove(wireframe);
        wireframeLines = hemesh.toWireframeGeometry();
        var wireframe = new THREE.LineSegments(wireframeLines, new THREE.LineBasicMaterial({
            color: 0xff2222,
            opacity: 0.2,
            transparent: true,
        }));
        setup.scene.add(wireframe);
        cancelRender=false;
        render();
    }
    else{
        setTimeout(updateRenderMesh,500);
    }
}
/*
function prova10(){
    var result=[];
    var n=hemesh.positions.length;
    var edgeGeometry = new THREE.Geometry();
    for(var i=0;i<n;i++){
      var vi=hemesh.positions[i];
      var h=hemesh.vertexHalfedge(i);    
      var di=hemesh.vertexValence(i);   
      var vetor =new THREE.Vector3(0.0,0.0,0.0);   
      hemesh.vertexCirculator(function (he){
          var j=hemesh.halfedgeSource(he);
          var vj=hemesh.positions[j];
          vetor.add(vj);
      },h);    
      vetor.divideScalar(di);
      var lapla=vi.clone().sub(vetor);      
      result.push(lapla);    
      edgeGeometry.vertices.push(hemesh.positions[i],hemesh.positions[i].clone().add(lapla));
    }
    var material = new THREE.LineBasicMaterial( {color: 0x0015FF, linewidth: 2 } );
    var edge= new THREE.LineSegments(edgeGeometry,material);
    //setup.scene.add(edge);    
    //console.log(result);
    return result;
}
function provaReconstruction(){
    
    var n=hemesh.positions.length;
    var fL=full(L);
    var r=3;
    //generating fixed vertors first n/3 vectors
    var fixed=[];
    for(var i=0;i<r;i++){
        fixed.push(hemesh.positions[i]);
    }
    console.log("fixed end");
    var laplacian=prova10();
    console.log("laplacian end");
    var A=zeros(n+r,n);
    var b=zeros(n+r,3);
    var vx=[];
    var vy=[];
    var vz=[];
    for(var i=0;i<n;i++){
        vx.push(hemesh.positions[i].x);
        vy.push(hemesh.positions[i].y);
        vz.push(hemesh.positions[i].z);
    }
    for(var i=0;i<n;i++){
        for(var j=0;j<n;j++){
            A.val[i*A.n+j]=fL.val[i*L.n+j];       
        }
        b.val[3*i]=laplacian[i].x;
        console.log(laplacian[i].x);
        b.val[3*i+1]=laplacian[i].y;
        b.val[3*i+2]=laplacian[i].z;
    }
    var web=100.0;
    for(var i=n;i<n+r;i++){
        // 100.0 for fixed vertices
        b.val[3*i]=web*fixed[i-n].x;
        b.val[3*i+1]=web*fixed[i-n].y;
        b.val[3*i+2]=web*fixed[i-n].z;
        console.log(web*fixed[i-n].x);
        // 100.0 for fixed vertices
        
        A.val[i*A.n+i-n]=web;
    }
    var box=mulMatrixVector(A,vx);
    
    console.log("comeca optimization");
    var bx=getCols(b,[0]);
    var by=getCols(b,[1]);
    var bz=getCols(b,[2]);
    console.log("bx original");
    console.log(sparse(box));
    console.log("bx gerado");
    console.log(sparse(bx));
    
    
    //var vx=cgnr(A,bx);
    
    //var vy=cgnr(A,by);
    //var vz=cgnr(A,bz);
    var At=transposeMatrix(A);
    var AtA=mulMatrixMatrix(At,A);
    var vx=mulMatrixVector(inv(AtA),mulMatrixVector(At,bx));
    var vy=mulMatrixVector(inv(AtA),mulMatrixVector(At,by));
    var vz=mulMatrixVector(inv(AtA),mulMatrixVector(At,bz));
    console.log("optimization end");
    var scale=fixed[0].x/vx[0];
    for (var i=0;i<n;i++){
        hemesh.positions[i].set(vx[i],vy[i],vz[i]);
        //hemesh.positions[i].multiplyScalar(scale);
        //hemesh.moveVertexTo(i, new THREE.Vector3(vx[i], vy[i], vz[i]));
    }
    var mesh=setup.scene.getObjectByName("mesh");
    
    var wireframe=setup.scene.getObjectByName("wireframe");
    
    mesh.geometry.verticesNeedUpdate = true;
	
	setup.scene.remove(wireframe);
	wireframeLines = hemesh.toWireframeGeometry();
    var wireframe = new THREE.LineSegments(wireframeLines, new THREE.LineBasicMaterial({
        color: 0xff2222,
        opacity: 0.2,
        transparent: true,
    }));
	setup.scene.add(wireframe);
    console.log("update vertex finish");
}
function provaConstrain(){
    var n=L.n;
    var fL=full(L);
   // FixedVertex=FixedVertex.slice(0,2);
    var m=n+FixedVertex.length;
    var A=zeros(m,n);
    var v=ones(n);
    //console.log(bconstrain);
    for(var i=n;i<m;i++){
        A.val[i*A.n+FixedVertex[i-n]]=FixedVertex[i-n];            
    }
    var b=mulMatrixVector(A,v);
    var result=sparse(b);
    console.log(result);
}
function provaMatrixL(){
    var n=hemesh.positions.length;
    var vx=[],vy=[],vz=[];
    var rx=[],ry=[],rz=[];
    for(var i=0;i<n;i++){
        vx.push(hemesh.positions[i].x);
        vy.push(hemesh.positions[i].y);
        vz.push(hemesh.positions[i].z);
    }
    var fL=full(L);
    var rx=mulMatrixVector(fL,vx);
    var ry=mulMatrixVector(fL,vy);
    var rz=mulMatrixVector(fL,vz);
    var result=[]
    var edgeGeometry = new THREE.Geometry();
    for(var i=0;i<n;i++){
        result.push(new THREE.Vector3(rx[i],ry[i],rz[i]));
        edgeGeometry.vertices.push(hemesh.positions[i],hemesh.positions[i].clone().add(result[i]));
    }
    var material = new THREE.LineBasicMaterial( {color: 0x22FFFF, linewidth: 2 } );
    var edge= new THREE.LineSegments(edgeGeometry,material);
    //setup.scene.add(edge);        
}
*/
