import Hero from "@/components/sections/Hero";
import Ticker from "@/components/sections/Ticker";
import ServiceArray from "@/components/sections/ServiceArray";
import WorkReel from "@/components/sections/WorkReel";
import Stockroom from "@/components/sections/experience/Stockroom";
import SystemDiagram from "@/components/sections/experience/SystemDiagram";
import People from "@/components/sections/People";
import Faq from "@/components/sections/Faq";
import Contact from "@/components/sections/Contact";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Ticker />
      <ServiceArray />
      <WorkReel />
      <Stockroom />
      <SystemDiagram />
      <People />
      <Faq />
      <Contact />
    </>
  );
}
