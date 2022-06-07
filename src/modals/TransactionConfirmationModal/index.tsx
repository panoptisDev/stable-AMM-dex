import { AlertTriangle, ArrowUpCircle, CheckCircle } from 'react-feather'
import { ChainId, Currency } from '../../sdk'
import React, { FC } from 'react'
import { Trans, t } from '@lingui/macro'

import Button from '../../components/Button'
import CloseIcon from '../../components/CloseIcon'
import ExternalLink from '../../components/ExternalLink'
import Image from '../../components/Image'
import Lottie from 'lottie-react'
import Modal from '../../components/Modal'
import ModalHeader from '../../components/ModalHeader'
import { RowFixed } from '../../components/Row'
import { getExplorerLink } from '../../functions/explorer'
import loadingRollingCircle from '../../animation/loading-rolling-circle.json'
import beamswapLoading from '../../animation/beam-loading.json'
import { useActiveWeb3React } from '../../hooks/useActiveWeb3React'
import useAddTokenToMetaMask from '../../hooks/useAddTokenToMetaMask'
import { useLingui } from '@lingui/react'
import Loader from '../../components/Loader'

interface ConfirmationPendingContentProps {
  onDismiss: () => void
  pendingText: string
  pendingText2: string
}

export const ConfirmationPendingContent: FC<ConfirmationPendingContentProps> = ({
  onDismiss,
  pendingText,
  pendingText2,
}) => {
  const { i18n } = useLingui()
  const headLine = pendingText.substring(0, pendingText.indexOf(' '))

  return (
    <div className="mx-5">
      <div className="flex justify-between mt-5">
        <div className="text-lg font-bold text-white" style={{ lineHeight: '45px' }}>
          {i18n._(t`Waiting for Confirmation`)}
        </div>
        <div className="p-3 bg-inputBlue">
          <CloseIcon onClick={onDismiss} />
        </div>
      </div>
      <div className="mt-5 mb-5 flex justify-center">
        <img src="/images/transaction-waiting.svg" />
      </div>
      {/* <div className="w-24 pb-4 m-auto text-center">...</div> */}
      <div className="flex flex-col items-center justify-center gap-3 bg-deepCove" style={{ margin: '0 -20px' }}>
        <div className="text-aqua mt-5 ml-5 font-bold text-lg mr-auto">{headLine}</div>
        <div className="font-bold pb-2 pr-8 mr-auto ml-5 text-white" style={{ borderBottom: '2px solid #1F357D' }}>
          {pendingText.substring(pendingText.indexOf(' ') + 1)}
        </div>
        {pendingText2 && <div className="font-bold">{pendingText2}</div>}
        <div className="text-sm text-aqua mb-8 mr-auto ml-5">{i18n._(t`Confirm this transaction in your wallet`)}</div>
      </div>
    </div>
  )
}

interface TransactionSubmittedContentProps {
  onDismiss: () => void
  hash: string | undefined
  chainId: ChainId
  currencyToAdd?: Currency | undefined
  inline?: boolean // not in modal
}

export const TransactionSubmittedContent: FC<TransactionSubmittedContentProps> = ({
  onDismiss,
  chainId,
  hash,
  currencyToAdd,
}) => {
  const { i18n } = useLingui()
  const { library } = useActiveWeb3React()
  const { addToken, success } = useAddTokenToMetaMask(currencyToAdd)
  return (
    <div className="mb-5">
      <div className="flex justify-end mt-5 mr-5" style={{ marginBottom: -40 }}>
        <div className="p-3 bg-inputBlue" style={{ border: '2px solid #1F357D', zIndex: 11 }}>
          <CloseIcon onClick={onDismiss} />
        </div>
      </div>
      <div className="pb-4 m-auto relative">
        <img className="mr-auto ml-auto" src="/images/transaction-submitted-bg.png" />
        <img
          className="mr-auto ml-auto"
          src="/images/transaction-submitted-rocket.svg"
          style={{ position: 'absolute', zIndex: '10', top: 75, right: 117 }}
        />
      </div>
      <div className="flex flex-col items-center justify-center gap-1">
        <div className="text-xl font-bold text-white">{i18n._(t`Transaction Submitted`)}</div>
        {chainId && hash && (
          <ExternalLink href={getExplorerLink(chainId, hash, 'transaction')}>
            <div className="font-bold text-aqua">{i18n._(t`View on explorer`)}</div>
          </ExternalLink>
        )}
        {currencyToAdd && library?.provider?.isMetaMask && (
          <Button color="gradient" onClick={addToken} className="w-auto mt-4 bg-linear-gradient">
            {!success ? (
              <RowFixed className="mx-auto space-x-2">
                <span>{i18n._(t`Add ${currencyToAdd.symbol} to MetaMask`)}</span>
                <Image
                  src="/images/wallets/metamask.png"
                  alt={i18n._(t`Add ${currencyToAdd.symbol} to MetaMask`)}
                  width={24}
                  height={24}
                  className="ml-1"
                />
              </RowFixed>
            ) : (
              <RowFixed>
                {i18n._(t`Added`)} {currencyToAdd.symbol}
                {/* <CheckCircle className="ml-1.5 text-2xl text-green" size="16px" /> */}
              </RowFixed>
            )}
          </Button>
        )}
        {/* <Button color="gradient" onClick={onDismiss} style={{ margin: '20px 0 0 0' }}>
          Close
        </Button> */}
      </div>
    </div>
  )
}

interface ConfirmationModelContentProps {
  title: string
  onDismiss: () => void
  topContent: () => React.ReactNode
  bottomContent: () => React.ReactNode
}

export const ConfirmationModalContent: FC<ConfirmationModelContentProps> = ({
  title,
  bottomContent,
  onDismiss,
  topContent,
}) => {
  return (
    <div className="grid gap-4">
      <ModalHeader title={title} onClose={onDismiss} />
      {topContent()}
      {bottomContent()}
    </div>
  )
}

interface TransactionErrorContentProps {
  message: string
  onDismiss: () => void
}

export const TransactionErrorContent: FC<TransactionErrorContentProps> = ({ message, onDismiss }) => {
  const { i18n } = useLingui()

  return (
    <div className="grid gap-6 mx-5 my-5">
      <div>
        <div className="flex justify-between">
          <div className="text-lg font-medium text-white">{i18n._(t`Error`)}</div>
          <div className="p-3 bg-inputBlue">
            <CloseIcon onClick={onDismiss} />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-3">
          <AlertTriangle className="text-aqua" style={{ strokeWidth: 1.5 }} size={64} />
          <div className="font-bold text-aqua text-wrap" style={{ whiteSpace: 'pre-wrap' }}>
            {message}
          </div>
        </div>
      </div>
      <div>
        <Button className="bg-linear-gradient w-full" style={{ height: 56 }} size="lg" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  )
}

interface ConfirmationModalProps {
  isOpen: boolean
  onDismiss: () => void
  hash: string | undefined
  content: () => React.ReactNode
  attemptingTxn: boolean
  pendingText: string
  pendingText2?: string
  currencyToAdd?: Currency | undefined
}

const TransactionConfirmationModal: FC<ConfirmationModalProps> = ({
  isOpen,
  onDismiss,
  attemptingTxn,
  hash,
  pendingText,
  pendingText2,
  content,
  currencyToAdd,
}) => {
  const { chainId } = useActiveWeb3React()

  if (!chainId) return null

  // confirmation screen
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} minHeight={10} maxWidth={attemptingTxn ? 400 : hash ? 357 : 400}>
      {attemptingTxn ? (
        <ConfirmationPendingContent onDismiss={onDismiss} pendingText={pendingText} pendingText2={pendingText2} />
      ) : hash ? (
        <TransactionSubmittedContent
          chainId={chainId}
          hash={hash}
          onDismiss={onDismiss}
          currencyToAdd={currencyToAdd}
        />
      ) : (
        content()
      )}
    </Modal>
  )
}

export default TransactionConfirmationModal
