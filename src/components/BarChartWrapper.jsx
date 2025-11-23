import React, { memo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

const BarChartWrapper = ({ data, colors }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="category" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" />
      <YAxis />
      <Tooltip formatter={val => `PHP ${parseFloat(val).toLocaleString()}.00`} />
      <Legend wrapperStyle={{ bottom: 0 }} />
      <Bar dataKey="total" name="Sales (PHP)">
        {data.map((entry, index) => (
          <Cell key={index} fill={colors[index % colors.length]} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

export default memo(BarChartWrapper);
