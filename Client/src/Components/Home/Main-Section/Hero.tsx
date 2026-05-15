import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Sparkles, ShieldCheck, Backpack, Leaf, Users, Star, Play } from "lucide-react";
import trek1 from "../../../assets/Hero-Section/final.png";

const featureCards = [
  {
    icon: Users,
    title: "Expert Guides",
    description: "Experienced & certified trekking professionals"
  },
  {
    icon: ShieldCheck,
    title: "Safety First",
    description: "Your safety is our top priority always"
  },
  {
    icon: Backpack,
    title: "Best Equipment",
    description: "Quality gear for a comfortable journey"
  },
  {
    icon: Leaf,
    title: "Sustainable Travel",
    description: "Eco-friendly adventures for a better tomorrow"
  }
];

const HeroSection = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoaded(true), 120);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section className="relative h-screen min-h-[900px] overflow-hidden bg-[#07171d] text-white">
      <div className="absolute inset-0">
        <img
          src={trek1}
          alt="Infinity Trekkers adventure backdrop"
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(16,185,129,0.22),transparent_34%),linear-gradient(100deg,rgba(3,17,23,0.88)_0%,rgba(3,17,23,0.68)_38%,rgba(3,17,23,0.35)_64%,rgba(3,17,23,0.12)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#04141b]/20 via-transparent to-[#04141b]/48" />
      </div>

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col px-6 pt-32 pb-6 sm:px-8 lg:px-10 lg:pt-36">
        <div className={`max-w-4xl transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
          <div className="mb-5 flex items-center gap-4 text-[13px] font-semibold uppercase tracking-[0.34em] text-white/80">
            <span className="h-[2px] w-9 bg-emerald-400" />
            Explore. Experience. Evolve.
            <span className="h-[1px] w-28 bg-white/30" />
          </div>

          <h1 className="leading-[0.93] tracking-tight">
            <span className="block text-5xl font-black text-white drop-shadow-[0_14px_28px_rgba(0,0,0,0.45)] sm:text-6xl lg:text-[94px]">INFINITY</span>
            <span className="mt-1 block text-5xl font-black sm:text-6xl lg:text-[94px] bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_10px_28px_rgba(16,185,129,0.30)]">
              TREKKERS INDIA
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-white/80 sm:text-lg lg:text-xl">
            Embark on extraordinary journeys through pristine landscapes. Conquer majestic peaks, traverse hidden trails, and forge unforgettable memories with passionate adventurers from around the globe.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              to="/upcoming-trek"
              onClick={() => window.scrollTo(0, 0)}
              className="inline-flex min-w-[250px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-7 py-4 text-base font-semibold text-white shadow-[0_16px_40px_rgba(16,185,129,0.35)] transition-transform duration-300 hover:scale-[1.02]"
            >
              <Sparkles className="h-4 w-4" />
              Start Your Adventure
            </Link>

            <Link
              to="/upcoming-trek"
              onClick={() => window.scrollTo(0, 0)}
              className="inline-flex min-w-[250px] items-center justify-center gap-2 rounded-2xl border border-white/45 bg-[#0c1f26]/45 px-7 py-4 text-base font-semibold text-white backdrop-blur-sm transition-colors duration-300 hover:bg-[#102831]/60"
            >
              <CalendarDays className="h-4 w-4" />
              Explore Treks
            </Link>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <span className="text-lg font-bold text-white">4.9</span>
              <span className="text-base font-medium text-white/70">250+ Reviews</span>
            </div>
          </div>
        </div>

        

        <div className="pointer-events-none absolute right-14 top-[74%] hidden lg:flex items-center gap-3 rounded-full bg-transparent px-2 py-2 text-2xl font-semibold text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg">
            <Play className="h-4 w-4 fill-current" />
          </span>
          Watch Our Story
        </div>

        <div className="mt-auto grid gap-4 pb-2 sm:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((card) => (
            <article
              key={card.title}
              className="rounded-3xl border border-white/10 bg-[#0b1f27]/66 p-6 backdrop-blur-md shadow-[0_18px_30px_rgba(0,0,0,0.20)]"
            >
              <card.icon className="h-10 w-10 text-emerald-300" />
              <h3 className="mt-4 text-xl font-semibold text-white">{card.title}</h3>
              <p className="mt-1 text-sm leading-6 text-white/72">{card.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
