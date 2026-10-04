export const vertexSource=`
attribute vec2 a_position;
varying vec2 v_uv;
void main(){
 v_uv=a_position*.5+.5;
 gl_Position=vec4(a_position,0.,1.);
}
`;
export const fragmentSource=`
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v_uv;
uniform vec2 u_size;
uniform float u_time;
uniform float u_dark;
uniform vec4 u_ripples[8];

vec2 hash(vec2 p){
 vec3 v=fract(vec3(p.x,p.y,p.x)*vec3(.1031,.11369,.13787));
 v+=dot(v,v.yzx+19.19);
 return fract(vec2((v.x+v.y)*v.z,(v.y+v.z)*v.x));
}
vec2 current(vec2 p){
 return vec2(
  sin(p.y*6.8+u_time*.42)+sin(p.x*5.2-p.y*3.1-u_time*.31),
  cos(p.x*7.3-u_time*.36)+sin(p.y*4.6+p.x*2.2+u_time*.28)
 )*.015;
}
float caustic(vec2 p){
 vec2 cell=floor(p),local=fract(p);
 float first=10.,second=10.;
 for(int y=-1;y<=1;y++){
  for(int x=-1;x<=1;x++){
   vec2 neighbor=vec2(float(x),float(y));
   vec2 seed=hash(cell+neighbor);
   vec2 center=.5+.33*sin(seed*6.28318+vec2(u_time*.28,-u_time*.23));
   vec2 delta=neighbor+center-local;
   float distance=dot(delta,delta);
   if(distance<first){second=first;first=distance;}else{second=min(second,distance);}
  }
 }
 return exp(-max(0.,sqrt(second)-sqrt(first))*24.);
}
void main(){
 float aspect=u_size.x/max(u_size.y,1.);
 vec2 p=v_uv*vec2(aspect,1.);
 vec2 flow=current(p);
 float wave=0.;
 for(int i=0;i<8;i++){
  vec4 r=u_ripples[i];
  if(r.w<.001)continue;
  vec2 delta=p-r.xy*vec2(aspect,1.);
  float distance=max(length(delta),.001);
  float front=r.z*.115;
  float envelope=exp(-pow((distance-front)*22.,2.))*exp(-r.z*1.15)*r.w;
  float ripple=sin(distance*70.-r.z*8.)*envelope;
  flow+=delta/distance*ripple*.018;
  wave+=ripple;
 }
 vec2 bed=p+flow;
 // Pool-floor seams are very faint and bend with the surface above them.
 vec2 tiles=fract(bed*u_size.y/68.);
 vec2 edge=min(tiles,1.-tiles);
 float grout=1.-smoothstep(.005,.018,min(edge.x,edge.y));
 float cellShade=hash(floor(bed*u_size.y/68.)).x;
 float light=caustic((p+flow*1.5)*9.2);
 float glow=caustic((p+flow*.7+vec2(4.3,2.7))*5.1);
 float depth=.5+.22*sin(p.x*1.8+p.y*2.3)+.1*cos(p.y*3.1);
 vec3 day=mix(vec3(.33,.70,.89),vec3(.58,.85,.93),depth);
 day+=(cellShade-.5)*.018+grout*.032;
 day+=vec3(.20,.24,.23)*light*.52+vec3(.04,.09,.11)*glow*.32;
 day+=max(wave,0.)*.017;
 vec3 night=mix(vec3(.045,.17,.25),vec3(.09,.27,.36),depth);
 night+=vec3(.08,.18,.22)*light*.36+glow*.015+wave*.009;
 vec3 color=mix(day,night,u_dark);
 float vignette=smoothstep(.12,.82,length((v_uv-.5)*vec2(.72,1.)));
 color*=1.-vignette*.065;
 // A quiet, broad reflection keeps small labels legible in the central column.
 float reflection=exp(-pow((v_uv.x-.5)*2.5,4.))*.15;
 color=mix(color,mix(vec3(.86,.96,.99),vec3(.11,.29,.38),u_dark),reflection);
 gl_FragColor=vec4(color,1.);
}
`;

export function createPoolRenderer(canvas){
 let gl;
 try{gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'low-power'});}catch{return null;}
 if(!gl)return null;
 const shaders=[],program=gl.createProgram(),buffer=gl.createBuffer();
 if(!program||!buffer){if(program)gl.deleteProgram(program);if(buffer)gl.deleteBuffer(buffer);return null;}
 let disposed=false;
 const dispose=()=>{
  if(disposed)return;disposed=true;
  gl.deleteBuffer(buffer);gl.deleteProgram(program);shaders.forEach(shader=>gl.deleteShader(shader));
 };
 try{
  for(const [type,source] of [[gl.VERTEX_SHADER,vertexSource],[gl.FRAGMENT_SHADER,fragmentSource]]){
   const shader=gl.createShader(type);if(!shader)throw Error('Shader unavailable');
   shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);
   if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('Shader compilation failed');
   gl.attachShader(program,shader);
  }
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Shader linking failed');
  gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'a_position');
  gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const size=gl.getUniformLocation(program,'u_size'),time=gl.getUniformLocation(program,'u_time');
  const dark=gl.getUniformLocation(program,'u_dark'),ripples=gl.getUniformLocation(program,'u_ripples[0]');
  return {
   draw(seconds,isDark,points,cssWidth,cssHeight){
    if(gl.isContextLost())return false;
    gl.viewport(0,0,canvas.width,canvas.height);gl.useProgram(program);
    // Every wave frequency is an integer multiple of .01: wrap at their shared
    // period, avoiding a visible time reset while keeping float precision.
    gl.uniform2f(size,cssWidth,cssHeight);gl.uniform1f(time,seconds%(Math.PI*200));
    gl.uniform1f(dark,isDark?1:0);gl.uniform4fv(ripples,points);
    gl.drawArrays(gl.TRIANGLES,0,3);return true;
   },
   dispose
  };
 }catch{dispose();return null;}
}
