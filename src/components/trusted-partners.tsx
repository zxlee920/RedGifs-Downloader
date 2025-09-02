'use client'

import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'

// 外链交换数据 - 可以轻松添加更多链接
const featuredLinks = [
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com',
    description: 'Leading technology news platform',
    rel: 'nofollow'
  },
  {
    name: 'Product Hunt',
    url: 'https://producthunt.com',
    description: 'Discover new products',
    rel: 'nofollow'
  },
  {
    name: 'GitHub',
    url: 'https://github.com',
    description: 'Developer platform',
    rel: '' // 传递权重
  },
  {
    name: 'Stack Overflow',
    url: 'https://stackoverflow.com',
    description: 'Developer community',
    rel: 'nofollow'
  },
  {
    name: 'Reddit',
    url: 'https://reddit.com',
    description: 'Social news aggregation',
    rel: 'nofollow'
  },
  {
    name: 'Hacker News',
    url: 'https://news.ycombinator.com',
    description: 'Tech news community',
    rel: 'nofollow'
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4
    }
  }
}

export default function TrustedPartners() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold mb-4">Trusted Partners</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Partnering with leading platforms to serve users worldwide
          </p>
        </motion.div>
        
        <motion.div 
          className="flex flex-wrap justify-center items-center gap-6 max-w-5xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {featuredLinks.map((link, index) => (
            <motion.div key={index} variants={itemVariants}>
              <motion.a
                href={link.url}
                target="_blank"
                rel={link.rel}
                className="group flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md hover:bg-muted transition-colors text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  {link.name}
                </span>
                <ExternalLink className="h-3 w-3 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors" />
              </motion.a>
            </motion.div>
          ))}
        </motion.div>
        
        {/* 可选：添加更多链接的提示 */}
        <motion.div 
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          viewport={{ once: true }}
        >
        </motion.div>
      </div>
    </section>
  )
}
