import Image from "next/image";
import TestimonialsAvatars from "./TestimonialsAvatars";
import config from "@/config";

const Hero = () => {
  return (
    <section>
      <div
        className="hero min-h-screen"
        style={{
          backgroundImage:
            "url(https://img.daisyui.com/images/stock/photo-1507358522600-9f71e620c44e.webp)",
        }}
      >
        <div className="hero-overlay bg-opacity-60"></div>
        <div className="hero-content text-neutral-content text-center">
          <div className="max-w-md">
            <h1 className="mb-5 text-5xl font-bold">
              Join the Madness with MashSports
            </h1>
            <p className="mb-5">
              A Mix of Fantasy Football and March Madness! Draft Your March
              Madness Team Now!
            </p>
            <button className="btn btn-primary btn-wide">
              Get {config.appName}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
