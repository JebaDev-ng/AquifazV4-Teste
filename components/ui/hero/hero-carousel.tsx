'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const carouselItems = [
  {
    id: 1,
    title: 'Cartões de Visita',
    image: '/products/business-cards.jpg',
    color: 'from-blue-500 to-purple-600',
  },
  {
    id: 2,
    title: 'Banners',
    image: '/products/banners.jpg',
    color: 'from-green-500 to-teal-600',
  },
  {
    id: 3,
    title: 'Adesivos',
    image: '/products/stickers.jpg',
    color: 'from-orange-500 to-red-600',
  },
  {
    id: 4,
    title: 'Flyers',
    image: '/products/flyers.jpg',
    color: 'from-pink-500 to-rose-600',
  },
]

export function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselItems.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative h-[500px] w-full perspective-1000">
      <div className="relative h-full">
        <AnimatePresence mode="wait">
          {carouselItems.map((item, index) => {
            const offset = (index - currentIndex + carouselItems.length) % carouselItems.length
            const isVisible = offset < 3

            if (!isVisible) return null

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, rotateY: -20, x: 100 }}
                animate={{
                  opacity: offset === 0 ? 1 : 0.6,
                  rotateY: offset * -8,
                  x: offset * 60,
                  y: offset * 20,
                  scale: 1 - offset * 0.1,
                  zIndex: 10 - offset,
                }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className={`h-full w-full rounded-2xl bg-gradient-to-br ${item.color} shadow-2xl p-8 flex items-end`}>
                  <div className="text-white">
                    <h3 className="text-3xl font-bold mb-2">{item.title}</h3>
                    <p className="text-white/80">Alta qualidade</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Indicators */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
        {carouselItems.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-gray-900 dark:bg-white w-8'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
