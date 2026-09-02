import React, { useEffect } from 'react'
import Navigation from './components/Navigation.jsx'
import Hero from './components/Hero.jsx'
import Marquee from './components/Marquee.jsx'
import Features from './components/Features.jsx'
import Process from './components/Process.jsx'
import Stats from './components/Stats.jsx'
import Testimonial from './components/Testimonial.jsx'
import CTA from './components/CTA.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
  }, [])

  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <Marquee />
        <Features />
        <Process />
        <Stats />
        <Testimonial />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
