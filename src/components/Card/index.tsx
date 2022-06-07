import React from 'react'

type CardProps = {
  header?: React.ReactChild
  footer?: React.ReactChild
  backgroundImage?: string
  title?: string
  description?: string
  removePadding?: boolean
} & React.HTMLAttributes<HTMLDivElement>

export default function Card({
  header = undefined,
  footer = undefined,
  backgroundImage = '',
  title = '',
  description = '',
  removePadding = false,
  children,
  className,
}: CardProps) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        borderRadius: '2px',
        backgroundImage: `url(${backgroundImage})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'contain',
        backgroundPosition: 'center bottom',
      }}
    >
      {header && <>{header}</>}

      <div className={!removePadding && ''}>
        {title && <div className="mb-4 text-2xl text-high-emphesis">{title}</div>}
        {description && <div className="text-white text-secondary">{description}</div>}
        {children}
      </div>

      {footer && <>{footer}</>}
    </div>
  )
}
