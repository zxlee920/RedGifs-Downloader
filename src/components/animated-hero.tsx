import { Download, Users, Zap } from 'lucide-react'
import AnimatedCounter from './animated-counter'

export default function AnimatedHero() {
  return (
    <section className="relative pt-20 pb-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5 overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-12">
          <h1 className="text-3xl lg:text-5xl font-bold mb-6">
            Download <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">HD</span> RedGifs Videos
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Fast & Free</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            The most reliable tool to download RedGifs videos and cover images. 
            No registration required, completely free, bulk download supported.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-primary" />
              <span><AnimatedCounter end={856918} suffix="+" /> Downloads</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-primary" />
              <span>Lightning Fast</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Download className="h-4 w-4 text-primary" />
              <span>Bulk Download</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
