// array of index(in vertexAdjacency array) from the constrain vertex 
var FixedVertex=[];
var FreeVertex=[];
var L={};
//var FreeVertex=[];

//by cotangent formula
//input array index from the half edge
function meanCurvaturesCurveCotangent(hecurve){
   var n=hecurve.length;
   var result=[];
   
   for(var i=0;i<n;i++){
       var hs = hecurve[i];
       var hf=hs;
       console.log("hs ",hs);
       var vetor=new THREE.Vector3(0.0, 0.0, 0.0);    
       do {
		   var h2 = hemesh.halfedgeNext(hf);
           var h3=-1,h4=-1,h5=-1,h6=-1;
           if(hemesh.halfedgeValid(h2)){
              h3 = hemesh.halfedgeNext(h2); 
           }
           var h4 = hemesh.halfedgeOpposite(hf);
           if(hemesh.halfedgeValid(h4)){
              h5 = hemesh.halfedgeNext(h4);  
           }
           if(hemesh.halfedgeValid(h5)){
              h6 = hemesh.halfedgeNext(h5);  
           }
           
           if(h6!=-1){
               var u = hemesh.halfedgeDirection(h3);
               var v = hemesh.halfedgeDirection(hemesh.halfedgeOpposite(h2));
               var uo = hemesh.halfedgeDirection(h6);
               var vo = hemesh.halfedgeDirection(hemesh.halfedgeOpposite(h5));
               var cotansum=u.dot(v)/u.clone().cross(v).length()+uo.dot(vo)/uo.clone().cross(vo).length();
               var pjpi=hemesh.positions[hemesh.halfedgeVertex(h4)].clone().sub(hemesh.halfedgeVertex(hf));

               vetor.add(pjpi.multiplyScalar(cotansum));
           }
           else{
                var pointGeometry = new THREE.Geometry();
                var pointmaterial = new THREE.PointsMaterial( {color: 0x27B327, size: 5.0, sizeAttenuation: false, alphaTest: 0.5 } );
                pointGeometry.vertices.push(hemesh.positions[hemesh.halfedgeVertex(hf)],hemesh.positions[hemesh.halfedgeVertex(h4)]);
                var particles=new THREE.Points(pointGeometry,pointmaterial);
                setup.scene.add(particles);
           }
           hf = hemesh.halfedgeSinkCCW(hf);
           console.log("hf ",hf);
       } while( (hf !== hs) && (hf != -1));
       result.push(0.5*vetor.length());
   }
   return result;    
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

//Laplacian for non-constrained vertex
function uniformLaplacian(){
    var n=hemesh.positions.length;
    var L=zeros(n,n);
    var result=[];
    for(var i=0;i<n;i++){
        result.push(hemesh.vertexValence(i));
        for(var j=0;j<n;j++){
            if(i==j){
                L.val[i*L.n+j]=1.0;    
            }
            else{
                var hs=hemesh.findHalfedge(i,j);
                if(hemesh.halfedgeValid(hs)){
                    L.val[i*L.n+j]=-1/hemesh.vertexValence(i);
                }
            }
        }
    }
    console.log(result);
    return L;
}

function FisrtIterationCurvaturesProcess(){
    var n=L.n;
    var m=n+FixedVertex.length;
    var A=zeros(m,n);
    var b=zeros(m);
    var bconstrain=FirstCurvaturesCurve();
    var c=zeros(n);
    for(var i=n;i<m;i++){
        b[i]=bconstrain[i-n];
        for(j=0;j<n;j++){
            if(FixedVertex.indexOf(j)!=-1){
              A.val[i*A.n+j]=1.0;       
            }
        }
    }
    var c=cgnr(A,b);
    console.log(c.length);
    return c;
}
//weight was advice from Andrew Nealen
function IterationCurvaturesProcess(cc){
    var n=L.n;
    var A=zeros(2*n,n);
    var b=zeros(2*n);
    var c=zeros(n);
    for(var i=n;i<2*n;i++){
        // 1.0 for fixed vertices
        if(FixedVertex.indexOf(i)!=-1){
              b[i]=cc[i-n];       
        }
        else{
            // use 0.1 for free vertices
            b[i]=0.1*cc[i-n];
        }
        for(j=0;j<n;j++){
            // 1.0 for fixed vertices
            if(FixedVertex.indexOf(j)!=-1){
              A.val[i*A.n+j]=1.0;       
            }
            else{// 0.1 for free vertices
              A.val[i*A.n+j]=0.1;           
            }
        }
    }
    var c=cgnr(A,b);
    console.log(c.length);
    return c;
}
function computeAverageEdgeLength(){
    
}