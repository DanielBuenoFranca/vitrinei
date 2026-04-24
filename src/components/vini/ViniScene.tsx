import officeBg from '@/assets/office-bg.jpg';
import officeBgMobile from '@/assets/office-bg-mobile.jpg';

/**
 * ViniScene — Background only.
 *
 * The Vini avatar was removed from the main screen. This component now
 * renders the futuristic-office image as the sole base layer, using a
 * responsive <picture> with a vertical mobile crop (centered on the
 * holographic floor circle) and a widescreen desktop crop.
 *
 * The image was upscaled, sharpened, color-graded and lit with a subtle
 * radial glow on the central ring during preprocessing — no runtime
 * filters are applied so the photo keeps its cinematic look untouched.
 */
export function ViniScene() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
      <picture>
        <source media="(max-width: 640px)" srcSet={officeBgMobile} />
        <img
          src={officeBg}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ imageRendering: 'auto' }}
        />
      </picture>
      {/* Very subtle vignette to anchor edges; no color shift */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 70%, transparent 45%, rgba(0,0,0,0.18) 85%, rgba(0,0,0,0.32) 100%)',
        }}
      />
    </div>
  );
}
