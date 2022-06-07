import React, { useRef, useState } from 'react'
import {
  setHardwareWallet,
  useExpertModeManager,
  useUserArcherUseRelay,
  useUserSingleHopOnly,
  useUserTransactionTTL,
} from '../../state/user/hooks'
import { useModalOpen, useToggleSettingsMenu } from '../../state/application/hooks'

import { ApplicationModal } from '../../state/application/actions'
import Button from '../Button'
import Modal from '../Modal'
import ModalHeader from '../ModalHeader'
import { ChainId, Percent } from '../../sdk'
import QuestionHelper from '../QuestionHelper'
import Toggle from '../Toggle'
import TransactionSettings from '../TransactionSettings'
import Typography from '../Typography'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import { useActiveWeb3React } from '../../hooks'
import settings from '../../animation/settings-slider.json'
import HoverLottie from '../HoverLottie'

export default function SettingsTab({ placeholderSlippage }: { placeholderSlippage?: Percent }) {
  const { i18n } = useLingui()
  const { chainId } = useActiveWeb3React()

  const node = useRef<HTMLDivElement>(null)
  const open = useModalOpen(ApplicationModal.SETTINGS)
  const toggle = useToggleSettingsMenu()

  const [expertMode, toggleExpertMode] = useExpertModeManager()

  const [hardwareWallet, setHardwareWalletOnly] = setHardwareWallet()

  const [singleHopOnly, setSingleHopOnly] = useUserSingleHopOnly()

  // show confirmation view before turning on
  const [showConfirmation, setShowConfirmation] = useState(false)

  const [ttl, setTtl] = useUserTransactionTTL()

  const [userUseArcher, setUserUseArcher] = useUserArcherUseRelay()

  return (
    <div className="flex relative" ref={node}>
      <div
        className="rounded flex items-center justify-center cursor-pointer py-1 px-3"
        style={{ fontSize: 12 }}
        onClick={toggle}
        id="open-settings-dialog-button"
      >
        <img src="/images/swap-settings.svg" height="18px" width="18px" />
        Settings
      </div>
      {open && (
        <Modal isOpen={open} onDismiss={toggle}>
          <ModalHeader title={i18n._(t`Transaction Settings`)} onClose={toggle} />
          <div className="p-4 space-y-4 w-full h-full transaction-settings">
            <TransactionSettings placeholderSlippage={placeholderSlippage} />

            <div className="flex gap-2 bg-blue justify-between p-5 rounded-md">
              <div className="flex items-center">
                <Typography variant="sm" className="text-primary">
                  {i18n._(t`Toggle Expert Mode`)}
                </Typography>
                <QuestionHelper
                  text={i18n._(t`Bypasses confirmation modals and allows high slippage trades. Use at your own risk.`)}
                />
              </div>
              <Toggle
                id="toggle-expert-mode-button"
                isActive={expertMode}
                toggle={
                  expertMode
                    ? () => {
                        toggleExpertMode()
                        setShowConfirmation(false)
                      }
                    : () => {
                        toggle()
                        setShowConfirmation(true)
                      }
                }
              />
            </div>
            <div className="flex gap-2 bg-blue justify-between p-5 rounded-md">
              <div className="flex items-center">
                <Typography variant="sm" className="text-primary">
                  {i18n._(t`Disable Multihops`)}
                </Typography>
                <QuestionHelper text={i18n._(t`Restricts swaps to direct pairs only.`)} />
              </div>
              <Toggle
                id="toggle-disable-multihop-button"
                isActive={singleHopOnly}
                toggle={() => (singleHopOnly ? setSingleHopOnly(false) : setSingleHopOnly(true))}
              />
            </div>
            <div className="flex gap-2 bg-blue justify-between p-5 rounded-md">
              <div className="flex items-center">
                <Typography variant="sm" className="text-primary">
                  {i18n._(t`Hardware Wallet`)}
                </Typography>
                <QuestionHelper text={i18n._(t`For users with Hardware Wallets.`)} />
              </div>
              <Toggle
                id="toggle-disable-multihop-button"
                isActive={hardwareWallet}
                toggle={() => (hardwareWallet ? setHardwareWalletOnly(false) : setHardwareWalletOnly(true))}
              />
            </div>
            {chainId == ChainId.MAINNET && (
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Typography variant="sm" className="text-primary">
                    {i18n._(t`MEV Shield by Archer DAO`)}
                  </Typography>
                  <QuestionHelper
                    text={i18n._(
                      t`Send transaction privately to avoid front-running and sandwich attacks. Requires a miner tip to incentivize miners`
                    )}
                  />
                </div>
                <Toggle
                  id="toggle-use-archer"
                  isActive={userUseArcher}
                  toggle={() => setUserUseArcher(!userUseArcher)}
                />
              </div>
            )}
          </div>
        </Modal>
      )}

      <Modal isOpen={showConfirmation} onDismiss={() => setShowConfirmation(false)}>
        <div className="space-y-4 mb-6">
          <ModalHeader title={i18n._(t`Are you sure?`)} onClose={() => setShowConfirmation(false)} />
          <Typography variant="lg" className="text-jordyBlue pr-5 pl-5">
            {i18n._(t`Expert mode turns off the confirm transaction prompt and allows high slippage trades
                                that often result in bad rates and lost funds.`)}
          </Typography>
          <Typography variant="sm" className="font-medium pr-5 pl-5 text-aqua">
            {i18n._(t`ONLY USE THIS MODE IF YOU KNOW WHAT YOU ARE DOING.`)}
          </Typography>
          <Button
            color="red"
            className="bg-linear-gradient"
            style={{ height: 57, width: '92%', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
            size="lg"
            onClick={() => {
              if (window.prompt(i18n._(t`Please type the word "confirm" to enable expert mode.`)) === 'confirm') {
                toggleExpertMode()
                setShowConfirmation(false)
              }
            }}
          >
            <Typography variant="lg" id="confirm-expert-mode">
              {i18n._(t`Turn On Expert Mode`)}
            </Typography>
          </Button>
        </div>
      </Modal>
    </div>
  )
}
