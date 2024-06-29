export const chromatic = {
    fragment: `
precision mediump float;

in vec2 vTextureCoord;
in vec2 vScreenCoord;
uniform sampler2D uSampler;

uniform vec2 uResolution;
uniform vec2 uRed;
uniform vec2 uGreen;
uniform vec2 uBlue;

uniform float uPower;
uniform float uOffset;
uniform float uBase;

void main(void) {
  float factor = max(pow(length(vScreenCoord * 2.0 - vec2(1.0, 1.0)), uPower) - uOffset, 0.0) + uBase;

  gl_FragColor.r = texture2D(uSampler, vTextureCoord + uRed * factor / uResolution).r;
  gl_FragColor.g = texture2D(uSampler, vTextureCoord + uGreen * factor / uResolution).g;
  gl_FragColor.b = texture2D(uSampler, vTextureCoord + uBlue * factor / uResolution).b;
  gl_FragColor.a = texture2D(uSampler, vTextureCoord).a;

  // gl_FragColor = vec4(vScreenCoord.x, vScreenCoord.y, 0, 0);
}
    `,
    vertex: `
in vec2 aPosition;
out vec2 vTextureCoord;

out vec2 vScreenCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition( void )
{
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;

    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord( void )
{
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main(void)
{
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
    vScreenCoord = aPosition;
}
    `
}