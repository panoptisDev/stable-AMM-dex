import React, { useState, useContext, useEffect } from 'react'
import useActiveWeb3React from '../../hooks/useActiveWeb3React'
import Modal from '../../components/Modal'
import ModalHeader from '../../components/ModalHeader'
import { Input as NumericalInput } from '../../components/NumericalInput'
import { ethers } from 'ethers'
import { useTransactionAdder } from '../../state/transactions/hooks'
import Dots from '../Dots'
import Button from '../Button'
import { CurrencyAmount, Token } from '../../sdk'

interface BloClaimModalProps {
  isOpen: boolean
  onDismiss: () => void
  onClose: () => void
  amount: any
  bloData: any
}

const BloClaimModal: React.FC<BloClaimModalProps> = ({ isOpen, onDismiss, amount, bloData }) => {
  const { account, chainId } = useActiveWeb3React()
  const [depositValue, setDepositValue] = useState('')
  const addTransaction = useTransactionAdder()
  const [pendingTx, setPendingTx] = useState(false)

  const getModalContent = () => (
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      <div className="space-y-4">
        <ModalHeader title={'Enter the amount to buy'} onClose={onDismiss} />
        <div className="wrapper flex-col items-center justify-center mx-5" style={{ marginBottom: 20 }}>
          <div className="flex justify-center mt-5 relative items-center">
            <NumericalInput
              className="px-4 py-4 pr-20 bg-inputBlue placeholder text-white"
              value={depositValue}
              onUserInput={setDepositValue}
            />
            <Button
              size="xs"
              onClick={() => {
                if (amount != 0) {
                  setDepositValue(amount.toString())
                }
              }}
              style={{ borderRadius: 2, border: 'none' }}
              className="absolute right-4 bg-royalBlue text-white"
            >
              MAX
            </Button>
          </div>
          {!pendingTx && (
            <>
              <Button
                color="gradient"
                className="w-full bg-linear-gradient text-sm md:text-md text-white mt-5"
                style={{ height: 48, color: 'white' }}
                disabled={false}
                onClick={() => {
                  // claim tx
                }}
              >
                CLAIM
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  )

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      {getModalContent()}
    </Modal>
  )
}

export default React.memo(BloClaimModal)
