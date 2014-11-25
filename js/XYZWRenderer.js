XYZWRenderer = function ( parameters ) {
  this.parameters = parameters;
  this.domElement = document.createElement("canvas");
  this.width = this.domElement.width;
  this.height = this.domElement.height;
};

XYZWRenderer.prototype = {

  setSize: function(width, height) {
    this.domElement.width = width;
    this.domElement.height = height;
    this.width = this.domElement.width;
    this.height = this.domElement.height;
  },

  projectVertex: function ( src, modelMatrix, viewProjectionMatrix ) {
    var vertex = new THREE.RenderableVertex();
    vertex.position.set(src.x, src.y, src.z);

    var position = vertex.position;
    var positionWorld = vertex.positionWorld;
    var positionScreen = vertex.positionScreen;

    positionWorld.copy( position ).applyMatrix4( modelMatrix );
    positionScreen.copy( positionWorld ).applyMatrix4( viewProjectionMatrix );

    var invW = 1 / positionScreen.w;

    positionScreen.x *= invW;
    positionScreen.y *= invW;
    positionScreen.z *= invW;

    vertex.visible = positionScreen.x >= - 1 && positionScreen.x <= 1 &&
      positionScreen.y >= - 1 && positionScreen.y <= 1 &&
      positionScreen.z >= - 1 && positionScreen.z <= 1;

    return vertex;
  },

  render: function(scene, camera) {
    var viewMatrix = new THREE.Matrix4(),
    viewProjectionMatrix = new THREE.Matrix4();

    scene.updateMatrixWorld();

    viewMatrix.copy(camera.matrixWorldInverse);
    viewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, viewMatrix);

    renderList = [];

    var _this = this;
    scene.traverseVisible( function ( object ) {
      if (object instanceof THREE.Mesh) {
        var faces = object.geometry.faces;
        console.log(faces);
        for (var f=0, fa=faces.length; f < fa; f++) {
          var face = faces[f];
          var v1 = object.geometry.vertices[face.a];
          var v2 = object.geometry.vertices[face.b];
          var v3 = object.geometry.vertices[face.c];

          v1 = _this.projectVertex(v1, object.matrixWorld, viewProjectionMatrix);
          v2 = _this.projectVertex(v2, object.matrixWorld, viewProjectionMatrix);
          v3 = _this.projectVertex(v3, object.matrixWorld, viewProjectionMatrix);

          if (v1.visible || v2.visible || v3.visible) {
            renderList.push([v1,v2,v3]);
          }
        }
      }
    });

    var faceZ = function(face) {
      return (face[0].positionScreen.z + face[1].positionScreen.z + face[2].positionScreen.z) / 3;
    }

    renderList.sort(function(a,b) {
      return faceZ(b) - faceZ(a);
    });

    var canvas = this.domElement;
    var context = canvas.getContext( '2d', {} );
    context.clearRect(0, 0, canvas.width, canvas.height);

    var scaleToViewSpace = function(vertex) {
      var x = (vertex.positionScreen.x / 2.0 + 0.5) * canvas.width;
      var y = (vertex.positionScreen.y / -2.0 + 0.5) * canvas.height;
      return {x: x, y: y};
    }

    for (var v=0, vl=renderList.length; v < vl; v++) {
      var tri = renderList[v];
      console.log(tri);

      var viewV1 = scaleToViewSpace(tri[0]);
      var viewV2 = scaleToViewSpace(tri[1]);
      var viewV3 = scaleToViewSpace(tri[2]);

      context.beginPath();
      context.fillStyle = "orange";
      context.strokeStyle = "black";

      context.moveTo(viewV1.x, viewV1.y);
      context.lineTo(viewV2.x, viewV2.y);
      context.lineTo(viewV3.x, viewV3.y);
      context.stroke();
      context.fill();
    }
  },



  scaleToCanvasX: function(x,canvas) {
    return (x / 2.0 + 0.5) * canvas.width;
  },
  scaleToCanvasY: function(y,canvas) {
    return (y / -2.0 + 0.5) * canvas.height;
  }

};
