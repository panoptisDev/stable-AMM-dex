import React, { PureComponent, useContext, useEffect, useState } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatNumberScale } from '../../functions';

const DashboardChart = ({ chartData }) => {
    const [activeIndex, setActiveIndex] = useState()
    const handleClick = (data, index) => {
        setActiveIndex(index)
    }

    const DataFormater = (number) => {
        if (number > 1000000000) {
            return (number / 1000000000).toString() + 'B';
        } else if (number > 900000) {
            return (number / 1000000).toString() + 'M';
        } else if (number > 1000) {
            return (number / 1000).toString() + 'K';
        } else {
            return number.toString();
        }
    }

    const LabelFormater = (number) => {
        return formatNumberScale(number)
    }
    return (
        <div style={{ width: '100%' }} className="mt-10 p-5 pb-0 mb-5 bg-deepCove rounded-md">
            <ResponsiveContainer width="100%" height={500}>
                <BarChart width={150} height={50} data={chartData} >
                    <Bar dataKey="uv" onClick={handleClick} label={{ position: 'top', formatter: LabelFormater }} fill="aqua"  >
                        {chartData.map((entry, index) => (
                            <Cell cursor="pointer" fill={index === activeIndex ? 'aqua' : 'aqua'} key={`cell-${index}`} />
                        ))}
                    </Bar>
                    <XAxis dataKey="pv" fill="#81A1E1" />
                    <YAxis fill="#81A1E1" tickFormatter={DataFormater} type="number" domain={[0, 2000000]} />
                </BarChart>
            </ResponsiveContainer>
            {/* <p className="content">{`Uv of "${activeItem.name}": ${activeItem.uv}`}</p> */}
        </div>
    )
}
export default DashboardChart

