import Image from 'next/image'
import React from 'react'
import styled from 'styled-components'

const SubHeader = styled.div`
  // color: ${({ theme }) => theme.text1};
  margin-top: 10px;
  font-size: 12px;
`

export default function Option({
  link = null,
  clickable = true,
  size,
  onClick = null,
  color,
  header,
  subheader = null,
  icon,
  active = false,
  id,
}: {
  link?: string | null
  clickable?: boolean
  size?: number | null
  onClick?: null | (() => void)
  color: string
  header: React.ReactNode
  subheader: React.ReactNode | null
  icon: string
  active?: boolean
  id: string
}) {
  const content = (
    <div
      onClick={onClick}
      className={`flex-col w-1/3 items-center justify-between w-full p-3 rounded-sm cursor-pointer bg-transparent hover:bg-deepCove ${
        !active ? 'bg-transparent hover:bg-deepCove' : 'bg-inputBlue'
      }`}
      style={{ marginTop: 0 }}
    >
      <div className="mr-auto ml-auto flex justify-center mt-1">
        <Image src={icon} alt={'Icon'} width="60px" height="60px" />
      </div>
      <div className="text-white text-center">
        <div className="flex items-center text-center justify-center mt-3">
          {active && <div className="w-4 h-4 mr-4 rounded-full bg-yellow" />}
          {header}
        </div>
        {subheader && <SubHeader>{subheader}</SubHeader>}
      </div>
    </div>
  )
  if (link) {
    return <a href={link}>{content}</a>
  }

  return !active ? content : content
}
