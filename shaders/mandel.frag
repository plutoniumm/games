struct App {
  float time;
  vec2 resolution;
};

struct Camera {
  vec3 position;
  mat4 viewMatrix;
  mat4 projectionMatrix;
};

struct Params {
  int numIterations;
  float convergenceCriteria;
  float finiteDifferenceEpsilon;
};

// ---------------- lighting ---------------- //

struct PointLight {
  vec3 position;
  vec3 ambientColor;
  vec3 diffuseColor;
  vec3 specularColor;
};

struct DirectionalLight {
  vec3 direction;
  vec3 ambientColor;
  vec3 diffuseColor;
  vec3 specularColor;
};

struct Material {
  vec3 ambientColor;
  vec3 diffuseColor;
  vec3 specularColor;
  vec3 emissionColor;
  float shininess;
};

// ---------------- primitives ---------------- //

struct Line {
  vec3 position;
  vec3 direction;
};

struct Sphere {
  vec3 position;
  float radius;
};

struct Intersection {
  vec3 position;
  bool intersected;
};

// ---------------- scene ---------------- //

const int numLights = 2;

struct Fractal {
  int power;
  int numIterations;
  float escapeCriteria;
};

struct Scene {
  vec3 backgroundColor;
  DirectionalLight lights[numLights];
  Material material;
  Sphere bound;
  Fractal fractal;
};

// ---------------- uniform ---------------- //

uniform App uApp;
uniform Camera uCamera;
uniform Params uParams;
uniform Scene uScene;

// ================ functions ================ //

// ---------------- utilities ---------------- //

vec2 linmap(vec2 in_val, vec2 in_min, vec2 in_max, vec2 out_min, vec2 out_max) {
  return (in_val - in_min) / (in_max - in_min) * (out_max - out_min) + out_min;
}

// ---------------- primitives ---------------- //

float sdfSphere(Sphere sphere, vec3 position) {
  return length(position - sphere.position) - sphere.radius;
}

vec3 normalSphere(Sphere sphere, vec3 position) {
  return normalize(position - sphere.position);
}

Intersection intersectionSphereLine(Sphere sphere, Line line) {
  vec3 difference = line.position - sphere.position;
  float a = dot(line.direction, line.direction);
  float b = 2.0 * dot(difference, line.direction);
  float c = dot(difference, difference) - pow(sphere.radius, 2.0);
  float d = pow(b, 2.0) - 4.0 * a * c;
  float t = (-b - sqrt(d)) / (2.0 * a);
  return Intersection(line.position + t * line.direction, d >= 0.0);
}

// ---------------- constructive solid geometry ---------------- //

float csgUnion(float sd1, float sd2) {
  return min(sd1, sd2);
}

float csgSubtraction(float sd1, float sd2) {
  return max(-sd1, sd2);
}

float csgIntersection(float sd1, float sd2) {
  return max(sd1, sd2);
}

// ---------------- quaternion ---------------- //
vec4 qMul(vec4 q1, vec4 q2) {
  return vec4(q1.x * q2.x - dot(q1.yzw, q2.yzw), q2.x * q1.yzw + q1.x * q2.yzw + cross(q1.yzw, q2.yzw));
}

vec4 qConj(vec4 q) {
  return vec4(q.x, -q.yzw);
}

vec4 qInv(vec4 q) {
  return qConj(q) / pow(length(q), 2.0);
}

vec4 qDiv(vec4 q1, vec4 q2) {
  return qMul(q1, qInv(q2));
}

vec4 qPow(vec4 q, int n) {
  vec4 p = vec4(1.0, vec3(0.0));
  for(int i = 0; i < n; ++i) {
    p = qMul(p, q);
  }
  return p;
}
// ---------------- dual ---------------- //

struct DualQ {
  vec4 q;
  vec4 d;
};

DualQ dqAdd(DualQ dq1, DualQ dq2) {
  return DualQ(dq1.q + dq2.q, dq1.d + dq2.d);
}

DualQ dqSub(DualQ dq1, DualQ dq2) {
  return DualQ(dq1.q - dq2.q, dq1.d - dq2.d);
}

DualQ dqMul(DualQ dq1, DualQ dq2) {
  return DualQ(qMul(dq1.q, dq2.q), qMul(dq1.d, dq2.q) + qMul(dq1.q, dq2.d));
}

DualQ dqDiv(DualQ dq1, DualQ dq2) {
  return DualQ(qDiv(dq1.q, dq2.q), qDiv(qMul(dq1.d, dq2.q) - qMul(dq1.q, dq2.d), qMul(dq2.q, dq2.q)));
}

DualQ dqPow(DualQ dq, int n) {
  DualQ dp = DualQ(vec4(1.0, vec3(0.0)), vec4(0.0, vec3(0.0)));
  for(int i = 0; i < n; ++i) {
    dp = dqMul(dp, dq);
  }
  return dp;
}

struct DualS {
  float s;
  float d;
};

DualS dAdd(DualS d1, DualS d2) {
  return DualS(d1.s + d2.s, d1.d + d2.d);
}

DualS dSub(DualS d1, DualS d2) {
  return DualS(d1.s - d2.s, d1.d - d2.d);
}

DualS dMul(DualS d1, DualS d2) {
  return DualS(d1.s * d2.s, d1.d * d2.s + d1.s * d2.d);
}

DualS dDiv(DualS d1, DualS d2) {
  return DualS(d1.s / d2.s, (d1.d * d2.s - d1.s * d2.d) / (d2.s * d2.s));
}

DualS dPow(DualS d, float n) {
  return DualS(pow(d.s, n), d.d * n * pow(d.s, n - 1.0));
}

DualS dSqrt(DualS d) {
  return DualS(sqrt(d.s), d.d * 0.5 / sqrt(d.s));
}

DualS dSin(DualS d) {
  return DualS(sin(d.s), d.d * cos(d.s));
}

DualS dCos(DualS d) {
  return DualS(cos(d.s), d.d * -sin(d.s));
}

DualS dTan(DualS d) {
  return DualS(tan(d.s), d.d / pow(cos(d.s), 2.0));
}

DualS dArcSin(DualS d) {
  return DualS(asin(d.s), d.d / sqrt(1.0 - pow(d.s, 2.0)));
}

DualS dArcCos(DualS d) {
  return DualS(acos(d.s), d.d / -sqrt(1.0 - pow(d.s, 2.0)));
}

DualS dArcTan(DualS d) {
  return DualS(atan(d.s), d.d / (1.0 + pow(d.s, 2.0)));
}

struct DualT {
  vec3 t;
  vec3 d;
};

DualT dtAdd(DualT dt1, DualT dt2) {
  return DualT(dt1.t + dt2.t, dt1.d + dt2.d);
}

DualT dtSub(DualT dt1, DualT dt2) {
  return DualT(dt1.t - dt2.t, dt1.d - dt2.d);
}

DualT dtPow(DualT dt, int n) {

  DualS dx = DualS(dt.t.x, dt.d.x);
  DualS dy = DualS(dt.t.y, dt.d.y);
  DualS dz = DualS(dt.t.z, dt.d.z);

  DualS dr = dSqrt(dAdd(dPow(dx, 2.0), dAdd(dPow(dy, 2.0), dPow(dz, 2.0))));

  if(dr.s > 0.0) {
    DualS da = dArcSin(dDiv(dz, dr));
    DualS db = dArcTan(dDiv(dy, dx));

    DualS dpr = dPow(dr, float(n));
    DualS dpa = dMul(da, DualS(float(n), 0.0));
    DualS dpb = dMul(db, DualS(float(n), 0.0));

    DualS dx = dMul(dpr, dMul(dCos(dpa), dCos(dpb)));
    DualS dy = dMul(dpr, dMul(dCos(dpa), dSin(dpb)));
    DualS dz = dMul(dpr, dSin(dpa));

    return DualT(vec3(dx.s, dy.s, dz.s), vec3(dx.d, dy.d, dz.d));
  } else {
    return DualT(vec3(0.0), vec3(0.0));
  }
}

// ---------------- fractals ---------------- //

float sdfJulia(Fractal fractal, vec4 z, vec4 c) {
  DualQ dzx = DualQ(z, vec4(1.0, 0.0, 0.0, 0.0));
  DualQ dzy = DualQ(z, vec4(0.0, 1.0, 0.0, 0.0));
  DualQ dzz = DualQ(z, vec4(0.0, 0.0, 1.0, 0.0));
  DualQ dzw = DualQ(z, vec4(0.0, 0.0, 0.0, 1.0));

  DualQ dcx = DualQ(c, vec4(0.0, 0.0, 0.0, 0.0));
  DualQ dcy = DualQ(c, vec4(0.0, 0.0, 0.0, 0.0));
  DualQ dcz = DualQ(c, vec4(0.0, 0.0, 0.0, 0.0));
  DualQ dcw = DualQ(c, vec4(0.0, 0.0, 0.0, 0.0));

  for(int i = 0; i < fractal.numIterations; ++i) {
        // forward-mode automatic differentiation
    dzx = dqAdd(dqPow(dzx, fractal.power), dcx);
    dzy = dqAdd(dqPow(dzy, fractal.power), dcy);
    dzz = dqAdd(dqPow(dzz, fractal.power), dcz);
    dzw = dqAdd(dqPow(dzw, fractal.power), dcw);

    if(length(dzx.q) > fractal.escapeCriteria)
      break;
  }

  mat4 J = mat4(dzx.d, dzy.d, dzz.d, dzw.d);
  return (length(dzx.q) * log(length(dzx.q))) / (2.0 * length(normalize(dzx.q) * J));
}
float sdfMandelbrot(Fractal fractal, vec4 c, vec4 z) {
  DualQ dzx = DualQ(z, vec4(0.0, 0.0, 0.0, 0.0));
  DualQ dzy = DualQ(z, vec4(0.0, 0.0, 0.0, 0.0));
  DualQ dzz = DualQ(z, vec4(0.0, 0.0, 0.0, 0.0));
  DualQ dzw = DualQ(z, vec4(0.0, 0.0, 0.0, 0.0));

  DualQ dcx = DualQ(c, vec4(1.0, 0.0, 0.0, 0.0));
  DualQ dcy = DualQ(c, vec4(0.0, 1.0, 0.0, 0.0));
  DualQ dcz = DualQ(c, vec4(0.0, 0.0, 1.0, 0.0));
  DualQ dcw = DualQ(c, vec4(0.0, 0.0, 0.0, 1.0));

  for(int i = 0; i < fractal.numIterations; ++i) {
        // forward-mode automatic differentiation
    dzx = dqAdd(dqPow(dzx, fractal.power), dcx);
    dzy = dqAdd(dqPow(dzy, fractal.power), dcy);
    dzz = dqAdd(dqPow(dzz, fractal.power), dcz);
    dzw = dqAdd(dqPow(dzw, fractal.power), dcw);

    if(length(dzx.q) > fractal.escapeCriteria)
      break;
  }

  mat4 J = mat4(dzx.d, dzy.d, dzz.d, dzw.d);
  return (length(dzx.q) * log(length(dzx.q))) / (2.0 * length(normalize(dzx.q) * J));
}
float sdfMandelbulb(Fractal fractal, vec3 c, vec3 z) {
  DualT dzx = DualT(z, vec3(0.0, 0.0, 0.0));
  DualT dzy = DualT(z, vec3(0.0, 0.0, 0.0));
  DualT dzz = DualT(z, vec3(0.0, 0.0, 0.0));

  DualT dcx = DualT(c, vec3(1.0, 0.0, 0.0));
  DualT dcy = DualT(c, vec3(0.0, 1.0, 0.0));
  DualT dcz = DualT(c, vec3(0.0, 0.0, 1.0));

  for(int i = 0; i < fractal.numIterations; ++i) {
        // forward-mode automatic differentiation
    dzx = dtAdd(dtPow(dzx, fractal.power), dcx);
    dzy = dtAdd(dtPow(dzy, fractal.power), dcy);
    dzz = dtAdd(dtPow(dzz, fractal.power), dcz);

    if(length(dzx.t) > fractal.escapeCriteria)
      break;
  }

  mat3 J = mat3(dzx.d, dzy.d, dzz.d);
  return (length(dzx.t) * log(length(dzx.t))) / (2.0 * length(normalize(dzx.t) * J));
}

vec4 normalJulia(Fractal fractal, vec4 z, vec4 c) {
  DualQ dzx = DualQ(z, vec4(1.0, 0.0, 0.0, 0.0));
  DualQ dzy = DualQ(z, vec4(0.0, 1.0, 0.0, 0.0));
  DualQ dzz = DualQ(z, vec4(0.0, 0.0, 1.0, 0.0));
  DualQ dzw = DualQ(z, vec4(0.0, 0.0, 0.0, 1.0));

  DualQ dcx = DualQ(c, vec4(0.0, 0.0, 0.0, 0.0));
  DualQ dcy = DualQ(c, vec4(0.0, 0.0, 0.0, 0.0));
  DualQ dcz = DualQ(c, vec4(0.0, 0.0, 0.0, 0.0));
  DualQ dcw = DualQ(c, vec4(0.0, 0.0, 0.0, 0.0));

  for(int i = 0; i < fractal.numIterations; ++i) {
        // forward-mode automatic differentiation
    dzx = dqAdd(dqPow(dzx, fractal.power), dcx);
    dzy = dqAdd(dqPow(dzy, fractal.power), dcy);
    dzz = dqAdd(dqPow(dzz, fractal.power), dcz);
    dzw = dqAdd(dqPow(dzw, fractal.power), dcw);

    if(length(dzx.q) > fractal.escapeCriteria)
      break;
  }

  mat4 J = mat4(dzx.d, dzy.d, dzz.d, dzw.d);
  return dzx.q * J;
}
vec4 normalMandelbrot(Fractal fractal, vec4 c, vec4 z) {
  DualQ dzx = DualQ(z, vec4(0.0, 0.0, 0.0, 0.0));
  DualQ dzy = DualQ(z, vec4(0.0, 0.0, 0.0, 0.0));
  DualQ dzz = DualQ(z, vec4(0.0, 0.0, 0.0, 0.0));
  DualQ dzw = DualQ(z, vec4(0.0, 0.0, 0.0, 0.0));

  DualQ dcx = DualQ(c, vec4(1.0, 0.0, 0.0, 0.0));
  DualQ dcy = DualQ(c, vec4(0.0, 1.0, 0.0, 0.0));
  DualQ dcz = DualQ(c, vec4(0.0, 0.0, 1.0, 0.0));
  DualQ dcw = DualQ(c, vec4(0.0, 0.0, 0.0, 1.0));

  for(int i = 0; i < fractal.numIterations; ++i) {
        // forward-mode automatic differentiation
    dzx = dqAdd(dqPow(dzx, fractal.power), dcx);
    dzy = dqAdd(dqPow(dzy, fractal.power), dcy);
    dzz = dqAdd(dqPow(dzz, fractal.power), dcz);
    dzw = dqAdd(dqPow(dzw, fractal.power), dcw);

    if(length(dzx.q) > fractal.escapeCriteria)
      break;
  }

  mat4 J = mat4(dzx.d, dzy.d, dzz.d, dzw.d);
  return dzx.q * J;
}
vec3 normalMandelbulb(Fractal fractal, vec3 c, vec3 z) {
  DualT dzx = DualT(z, vec3(0.0, 0.0, 0.0));
  DualT dzy = DualT(z, vec3(0.0, 0.0, 0.0));
  DualT dzz = DualT(z, vec3(0.0, 0.0, 0.0));

  DualT dcx = DualT(c, vec3(1.0, 0.0, 0.0));
  DualT dcy = DualT(c, vec3(0.0, 1.0, 0.0));
  DualT dcz = DualT(c, vec3(0.0, 0.0, 1.0));

  for(int i = 0; i < fractal.numIterations; ++i) {
        // forward-mode automatic differentiation
    dzx = dtAdd(dtPow(dzx, fractal.power), dcx);
    dzy = dtAdd(dtPow(dzy, fractal.power), dcy);
    dzz = dtAdd(dtPow(dzz, fractal.power), dcz);

    if(length(dzx.t) > fractal.escapeCriteria)
      break;
  }

  mat3 J = mat3(dzx.d, dzy.d, dzz.d);
  return dzx.t * J;
}

// ---------------- reflection ---------------- //

vec3 phongReflection(vec3 surfaceNormal, vec3 viewDirection, DirectionalLight lights[numLights], Material material) {
  surfaceNormal = normalize(surfaceNormal);
  viewDirection = normalize(viewDirection);

  vec3 ambientColor = vec3(0.0);
  vec3 diffuseColor = vec3(0.0);
  vec3 specularColor = vec3(0.0);

  for(int i = 0; i < lights.length(); ++i) {
    vec3 lightDirection = normalize(lights[i].direction);
    vec3 reflectedDirection = reflect(lightDirection, surfaceNormal);
    float diffuseCoefficient = max(dot(-lightDirection, surfaceNormal), 0.0);
    float specularCoefficient = pow(max(dot(reflectedDirection, -viewDirection), 0.0), material.shininess);
    ambientColor += lights[i].ambientColor * material.ambientColor;
    diffuseColor += lights[i].diffuseColor * material.diffuseColor * diffuseCoefficient;
    specularColor += lights[i].specularColor * material.specularColor * specularCoefficient;
  }

  vec3 color = clamp(ambientColor + diffuseColor + specularColor + material.emissionColor, 0.0, 1.0);
  return color;
}

// ---------------- sphere tracing ---------------- //

vec3 sphereTracing(App app, Scene scene, Params params, Line ray) {
  Intersection intersection = intersectionSphereLine(scene.bound, ray);

  if(intersection.intersected) {
    ray.position = intersection.position;

    // The hyperparameter from Inigo Quilez (https://www.shadertoy.com/view/MsfGRr)
    vec4 juliaType = 0.45 * cos(vec4(0.5, 3.9, 1.4, 1.1) + app.time * 0.15 * vec4(1.2, 1.7, 1.3, 2.5)) - vec4(0.3, 0.0, 0.0, 0.0);
    vec4 criticalPoint = vec4(0.0);

    for(int i = 0; i < params.numIterations; ++i) {
      float sd = sdfMandelbulb(scene.fractal, ray.position, criticalPoint.xyz);
      // ray marching
      ray.position += sd * ray.direction;
      // collision detection
      if(abs(sd) < params.convergenceCriteria) {
        vec3 surfaceNormal = normalize(normalMandelbulb(scene.fractal, ray.position, criticalPoint.xyz));
        //  frag color
        return phongReflection(surfaceNormal, ray.direction, scene.lights, scene.material);
      }

      if(sdfSphere(scene.bound, ray.position) > 0.0)
        break;
    }
  }

  return scene.backgroundColor;
}

// ---------------- main ---------------- //

void main() {
  vec2 fragCoord = linmap(gl_FragCoord.xy, vec2(0, 0), uApp.resolution, vec2(-1.0, -1.0), vec2(1.0, 1.0));
  vec3 rayDirection = normalize(inverse(mat3(uCamera.projectionMatrix) * mat3(uCamera.viewMatrix)) * vec3(fragCoord, 1.0));

  Line ray = Line(uCamera.position, rayDirection);
  vec3 fragColor = sphereTracing(uApp, uScene, uParams, ray);
  gl_FragColor = vec4(fragColor, 1.0);
}