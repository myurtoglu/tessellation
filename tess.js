"use strict";

var canvas;
var gl;

var points = [];

var numTimesToSubdivide = 0;

var colorDraw = 0.0;
var pureRotation = 0.0;
var theta = 0.0;
var shape = "triangle";

var bufferId;

/* exported changeRecursiveSteps */
function changeRecursiveSteps(newValue) {
    document.getElementById("range").innerHTML = newValue;
    numTimesToSubdivide = Number(newValue);
    render();
}

function changeTheta(newValue) {
    document.getElementById("theta").innerHTML = newValue;
    gl.uniform1f(theta, Number(newValue));
    render();
}

function checkboxChange() {
    render();
}

function changeShape(value) {
    shape = value;
    render();
}

function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    //
    //  Configure WebGL
    //
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.663, 0.663, 0.663, 1.0);

    //  Load shaders and initialize attribute buffers

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Load the data into the GPU

    bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    var maxRecursions = document.getElementById("recursionSlider").max;
    var maxNumberOfPoints = Math.pow(4, maxRecursions) * 4;
    gl.bufferData(gl.ARRAY_BUFFER, 8 * maxNumberOfPoints, gl.STATIC_DRAW);

    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    colorDraw = gl.getUniformLocation(program, "colorDraw");
    pureRotation = gl.getUniformLocation(program, "pureRotation");
    theta = gl.getUniformLocation(program, "theta");

    render();
}

function triangle(a, b, c) {
    points.push(a, b, c);
}

function divideTriangle(a, b, c, count) {
    // check for end of recursion
    if (count <= 0) {
        triangle(a, b, c);
    }
    else {

        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var bc = mix(b, c, 0.5);

        --count;

        divideTriangle(a, ab, ac, count);
        divideTriangle(c, ac, bc, count);
        divideTriangle(b, bc, ab, count);
        if (!document.getElementById("gasketCheckbox").checked) {
            divideTriangle(ab, bc, ac, count);
        }
    }
}

function square(a, b, c, d) {
    points.push(a, b, c, d);
}

function divideSquare(a, b, c, d, count) {
    if (count <= 0) {
        square(a, b, c, d);
    }
    else {
        var ab = mix(a, b, 0.5);
        var bc = mix(b, c, 0.5);
        var cd = mix(c, d, 0.5);
        var ad = mix(a, d, 0.5);
        var mid = mix(a, c, 0.5);

        --count;

        divideSquare(a, ab, mid, ad, count);
        divideSquare(ab, b, bc, mid, count);
        divideSquare(mid, bc, c, cd, count);
        divideSquare(ad, mid, cd, d, count);
    }
}

window.onload = init;

function render() {
    points = [];

    if (document.getElementById("colorDrawCheckbox").checked) {
        gl.uniform1f(colorDraw, 1.0);
    }
    else {
        gl.uniform1f(colorDraw, 0.0);
    }

    if (document.getElementById("pureRotationCheckbox").checked) {
        gl.uniform1f(pureRotation, 1.0);
    }
    else {
        gl.uniform1f(pureRotation, 0.0);
    }

    if (shape === "triangle") {
        var triangleVertices = [vec2(-0.5, -0.5), vec2(0, 0.5), vec2(0.5, -0.5)];
        divideTriangle(triangleVertices[0], triangleVertices[1],
            triangleVertices[2], numTimesToSubdivide);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));
        gl.clear(gl.COLOR_BUFFER_BIT);
        if (document.getElementById("wireframeCheckbox").checked) {
            for (var i = 0; i < points.length / 3; i++) {
                gl.drawArrays(gl.LINE_LOOP, 3 * i, 3);
            }
        }
        else {
            gl.drawArrays(gl.TRIANGLES, 0, points.length);
        }
    }
    else {
        var squareVertices = [vec2(-0.5, 0.5), vec2(0.5, 0.5), vec2(0.5, -0.5),
                              vec2(-0.5, -0.5)
        ];
        divideSquare(squareVertices[0], squareVertices[1], squareVertices[2],
            squareVertices[3], numTimesToSubdivide);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));
        gl.clear(gl.COLOR_BUFFER_BIT);
        if (document.getElementById("wireframeCheckbox").checked) {
            for (var i = 0; i < points.length / 4; i++) {
                gl.drawArrays(gl.LINE_LOOP, 4 * i, 4);
            }
        }
        else {
            for (var i = 0; i < points.length / 4; i++) {
                gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
            }
        }
    }
}
