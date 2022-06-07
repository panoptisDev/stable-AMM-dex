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
import useBlo from '../../features/blo/useBlo'
import { formatNumber } from '../../functions'
import { useTokenBalance } from '../../state/wallet/hooks'
import { BEAMSHARE_ADDRESS } from '../../constants'

interface BloModalProps {
  isOpen: boolean
  onDismiss: () => void
  onClose: () => void
  amount: any
  bloData: any
}

const BloModal: React.FC<BloModalProps> = ({ isOpen, onDismiss, amount, bloData }) => {
  const { account, chainId } = useActiveWeb3React()
  const [depositValue, setDepositValue] = useState('')
  const addTransaction = useTransactionAdder()
  const [pendingTx, setPendingTx] = useState(false)
  const { buyGlmr } = useBlo()

  const maxAmount = Number(amount?.toSignificant())

  //we can check this on staging

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
            <div className="flex flex-col absolute" style={{ right: '4.3rem' }}>
              <div
                onClick={() => {
                  setDepositValue(formatNumber(Number(amount?.toSignificant()).toString(), false))
                }}
                className="text-xxs font-medium text-right cursor-pointer text-aqua"
              >
                <>
                  {'Balance:'} {formatNumber(Number(amount?.toSignificant()).toString(), false)} GLMR
                </>
              </div>
            </div>
            <Button
              size="xs"
              onClick={() => {
                if (amount != 0) {
                  setDepositValue(maxAmount.toString())
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
                onClick={async () => {
                  setPendingTx(true)
                  try {
                    const tempAmount = Number(depositValue) - 0.008
                    const buyAmount = ethers.utils.parseEther(tempAmount.toString())
                    const tx = await buyGlmr(buyAmount)
                    await tx.wait()
                    addTransaction(tx, {
                      summary: `Buy GLINT with ${depositValue} GLMR`,
                    })
                  } catch (error) {
                    console.error(error)
                    setPendingTx(false)
                    onDismiss()
                  }
                  setPendingTx(false)
                  onDismiss()
                }}
              >
                BUY
              </Button>
            </>
          )}
          {pendingTx && (
            <>
              <Button
                color="gradient"
                className="w-full bg-linear-gradient text-sm md:text-md text-white mt-5"
                style={{ height: 48, color: 'white' }}
                disabled={true}
                onClick={() => {}}
              >
                BUYING...
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

export default React.memo(BloModal)
