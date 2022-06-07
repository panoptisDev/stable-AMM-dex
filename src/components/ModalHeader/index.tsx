import { ChevronLeftIcon, XIcon } from '@heroicons/react/outline'

import React, { FC } from 'react'
import Typography from '../Typography'

interface ModalHeaderProps {
  title?: string
  className?: string
  onClose?: () => void
  onBack?: () => void
}

const ModalHeader: FC<ModalHeaderProps> = ({
  title = undefined,
  onClose = undefined,
  className = '',
  onBack = undefined,
}) => {
  return (
    <div
      className={`flex items-center justify-center mb-4 ${className} p-6`}
      style={{ borderBottom: '1px solid #1F357D', position: 'relative' }}
    >
      <div
        className="flex items-center justify-center w-6 h-6 cursor-pointer text-primary hover:text-high-emphesis mr-auto"
        style={{ position: 'absolute', left: 18, fontSize: 16 }}
        onClick={onClose}
      >
        <img className="modal-close" src="/images/modal-close.svg" width="18px" height="18px" />
      </div>
      {onBack && <ChevronLeftIcon onClick={onBack} width={24} height={24} className="cursor-pointer" />}
      {title && (
        <Typography component="h2" variant="h3" className="font-bold" style={{ color: '#fff', fontSize: 16 }}>
          {title}
        </Typography>
      )}
    </div>
  )
}

export default ModalHeader
