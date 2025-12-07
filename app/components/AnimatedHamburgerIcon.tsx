import { motion, Variants, Transition, easeOut } from 'framer-motion'

interface Props {
  isOpen: boolean
  className?: string
}

const baseTransition: Transition = {
  duration: 0.3,
  ease: easeOut,
}

const topLineVariants: Variants = {
  closed: { rotate: 0, y: 0, transition: baseTransition },
  open: { rotate: 45, y: 8, transition: baseTransition },
}

const bottomLineVariants: Variants = {
  closed: { rotate: 0, y: 0, transition: baseTransition },
  open: { rotate: -45, y: -8, transition: baseTransition },
}

const middleLineContainerVariants: Variants = {
  open: { opacity: 1, transition: { duration: 0.1 } },
  closed: { opacity: 1, transition: { delay: 0.4, duration: 0.1 } },
}

const middleLineInnerVariants: Variants = {
  open: { scaleX: 0, transition: { duration: 0.2, ease: easeOut } },
  closed: {
    scaleX: 1,
    transition: { delay: 0.45, duration: 0.3, ease: easeOut },
  },
}

export const AnimatedHamburgerIcon = ({ isOpen, className }: Props) => {
  return (
    <motion.div
      className={`relative h-5 w-6 ${className || ''}`.trim()}
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
    >
      <motion.span
        variants={topLineVariants}
        style={{ originX: 0.5, originY: 0.5 }}
        className="absolute left-0 top-0 h-0.5 w-full bg-current"
      />

      <motion.div
        className="absolute left-0 top-2 flex h-0.5 w-full justify-center overflow-hidden"
        variants={middleLineContainerVariants}
      >
        <motion.span
          variants={middleLineInnerVariants}
          initial={false}
          style={{ originX: 0.5 }}
          className="h-full w-full bg-current"
        />
      </motion.div>

      <motion.span
        variants={bottomLineVariants}
        style={{ originX: 0.5, originY: 0.5 }}
        className="absolute left-0 top-4 h-0.5 w-full bg-current"
      />
    </motion.div>
  )
}
