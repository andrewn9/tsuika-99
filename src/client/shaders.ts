export const chromatic = {
    fragment: `
#version 300 es

precision mediump float;

out vec4 fragColor;

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

    fragColor = vec4(0.0);

  fragColor.r = texture(uSampler, vTextureCoord + uRed * factor / uResolution).r;
  fragColor.g = texture(uSampler, vTextureCoord + uGreen * factor / uResolution).g;
  fragColor.b = texture(uSampler, vTextureCoord + uBlue * factor / uResolution).b;
  fragColor.a = texture(uSampler, vTextureCoord).a;

  // fragColor = vec4(vScreenCoord.x, vScreenCoord.y, 0, 0);
}
    `,
    vertex: `
#version 300 es

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

export const bloom = {
	fragment: `
	#version 330 core
	out vec4 FragColor;
	  
	in vec2 aPosition;
	
	uniform sampler2D scene;
	uniform sampler2D bloomBlur;
	uniform float exposure;
	
	void main()
	{             
		const float gamma = 2.2;
		vec3 hdrColor = texture(scene, aPosition).rgb;      
		vec3 bloomColor = texture(bloomBlur, aPosition).rgb;
		hdrColor += bloomColor; // additive blending
		// tone mapping
		vec3 result = vec3(1.0) - exp(-hdrColor * exposure);
		// also gamma correct while we're at it       
		result = pow(result, vec3(1.0 / gamma));
		FragColor = vec4(result, 1.0);
	}  
	`,
	vertex: `
	in vec2 aPosition;
	out vec2 vTextureCoord;

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
	}
	`
}