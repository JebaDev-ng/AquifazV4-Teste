'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PricingTier {
  name: string
  quantity: string
  idealFor: string
  price: string
  features: string[]
  highlighted?: boolean
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Básico',
    quantity: '8 artes/mês',
    idealFor: 'Pequenos negócios',
    price: 'R$ 350 – R$ 500',
    features: [
      'Posts para redes sociais',
      'Formatos básicos',
      'Revisões incluídas',
      'Suporte por WhatsApp'
    ]
  },
  {
    name: 'Intermediário',
    quantity: '12 artes/mês',
    idealFor: 'Constância nas redes',
    price: 'R$ 600 – R$ 900',
    features: [
      'Posts + Stories',
      'Calendário editorial',
      'Revisões ilimitadas',
      'Suporte prioritário',
      'Formatos variados'
    ],
    highlighted: true
  },
  {
    name: 'Premium',
    quantity: '20 artes/mês',
    idealFor: 'Negócios ativos com vendas',
    price: 'R$ 1.000 – R$ 1.600',
    features: [
      'Conteúdo completo',
      'Estratégia visual',
      'Revisões ilimitadas',
      'Suporte dedicado',
      'Todos os formatos',
      'Relatório mensal'
    ]
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
}

export function PricingSection() {
  return (
    <section className="py-12 md:py-16 bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 md:mb-12"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-[550] mb-3 text-[#1D1D1F] dark:text-white">
            Planos e Preços
          </h2>
          <p className="text-sm sm:text-base text-[#6E6E73] dark:text-[#98989D] max-w-2xl mx-auto">
            Escolha o plano ideal para manter sua presença digital sempre atualizada
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6 max-w-5xl mx-auto"
        >
          {pricingTiers.map((tier) => (
            <motion.div
              key={tier.name}
              variants={cardVariants}
              className={cn(
                'relative rounded-xl p-6 border-2 transition-all duration-300',
                tier.highlighted
                  ? 'border-[#1D1D1F] dark:border-white bg-[#F5F5F5] dark:bg-[#1C1C1E] shadow-lg md:scale-105'
                  : 'border-[#D2D2D7] dark:border-[#38383A] bg-white dark:bg-black hover:border-[#6E6E73] dark:hover:border-[#98989D]'
              )}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F] px-3 py-0.5 rounded-full text-xs font-medium">
                  Mais Popular
                </div>
              )}

              {/* Plan Name */}
              <div className="mb-4">
                <h3 className="text-xl font-[550] text-[#1D1D1F] dark:text-white mb-1">
                  {tier.name}
                </h3>
                <p className="text-xs text-[#6E6E73] dark:text-[#98989D]">
                  {tier.idealFor}
                </p>
              </div>

              {/* Quantity */}
              <div className="mb-4">
                <div className="text-base font-[550] text-[#6E6E73] dark:text-[#98989D]">
                  {tier.quantity}
                </div>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="text-2xl font-[550] text-[#1D1D1F] dark:text-white">
                  {tier.price}
                </div>
                <div className="text-xs text-[#86868B] dark:text-[#636366] mt-0.5">
                  por mês
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-6">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#6E6E73] dark:text-[#98989D] flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-[#6E6E73] dark:text-[#98989D]">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <a
                href={`https://wa.me/5563992731977?text=Olá!%20Tenho%20interesse%20no%20Plano%20${encodeURIComponent(tier.name)}%20(${encodeURIComponent(tier.quantity)})%20-%20${encodeURIComponent(tier.price)}.%20Gostaria%20de%20mais%20informações.`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'block w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300 text-center',
                  tier.highlighted
                    ? 'bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F] hover:bg-[#6E6E73] dark:hover:bg-[#F5F5F5]'
                    : 'bg-[#F5F5F5] dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-white hover:bg-[#1D1D1F] hover:text-white dark:hover:bg-white dark:hover:text-[#1D1D1F]'
                )}
              >
                Escolher Plano
              </a>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer Note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-[#86868B] dark:text-[#636366] mt-8"
        >
          Todos os planos incluem suporte via WhatsApp e revisões. Entre em contato para planos personalizados.
        </motion.p>
      </div>
    </section>
  )
}
