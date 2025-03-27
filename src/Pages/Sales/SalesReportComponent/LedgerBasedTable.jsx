import { Fragment, useEffect, useMemo, useState } from "react";
import FilterableTable from "../../../Components/filterableTable2";
import { isEqualNumber, checkIsNumber, filterableText, groupData, Addition, toNumber, Division } from '../../../Components/functions'
import { Autocomplete, Button, Card, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Switch, TextField, Tooltip } from "@mui/material";
import { CheckBoxOutlineBlank, CheckBox, FilterAltOff, Settings, FilterAlt } from '@mui/icons-material'
import { fetchLink } from "../../../Components/fetchComponent";
import DisplayArrayData from "./DataSetDisplay";
const icon = <CheckBoxOutlineBlank fontSize="small" />;
const checkedIcon = <CheckBox fontSize="small" />;

const LedgerDetails = ({ row, Fromdate, Todate, DB }) => {
    const [salesData, setSalesData] = useState([]);
    const [dataTypes, setDataTypes] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetchLink({
            address: `reports/salesReport/ledger/itemDetails?Fromdate=${Fromdate}&Todate=${Todate}&Ledger_Id=${row?.Ledger_Tally_Id}`,
            headers: {
                'Db': DB
            }
        }).then(({ success, data, others }) => {
            if (success) {
                const { dataTypeInfo } = others;
                setSalesData(data);
                setDataTypes(pre => ({ ...pre, salesInfo: Array.isArray(dataTypeInfo) ? dataTypeInfo : [] }))
            } else {
                setSalesData([]);
            }
        }).catch(e => console.error(e)).finally(() => {
            setLoading(false);
        });
    }, [row?.Ledger_Tally_Id, Fromdate, Todate])

    return (
        loading
            ? <h5 className="text-center text-primary ">Loading...</h5>
            : <DisplayArrayData dataArray={salesData} columns={dataTypes.salesInfo} />
    )
}

const LedgerBasedSalesReport = ({ dataArray, colTypes, DB, Fromdate, Todate }) => {
    const [filters, setFilters] = useState({});
    const [groupBy, setGroupBy] = useState('');
    const [filteredData, setFilteredData] = useState([]);
    const [dialog, setDialog] = useState(false);
    const [filterDialog, setFilterDialog] = useState(false);
    const propsColumns = colTypes.map((col, colInd) => ({
        isVisible: colInd < 10 ? 1 : 0,
        Field_Name: col?.Column_Name,
        Fied_Data: col?.Data_Type,
        OrderBy: colInd + 1
    }));
    const [columns, setColumns] = useState(propsColumns);

    const sortedCoulumns = useMemo(() => {
        return [...columns].sort(
            (a, b) => (
                a?.OrderBy && b?.OrderBy
            ) ? a?.OrderBy - b?.OrderBy : b?.OrderBy - a?.OrderBy
        )
    }, [columns])

    const DisplayColumn = useMemo(() => {
        return sortedCoulumns.filter(
            col => (isEqualNumber(col?.Defult_Display, 1) || isEqualNumber(col?.isVisible, 1))
        )
    }, [sortedCoulumns])

    const showData = useMemo(() => {
        const filter = Object.keys(filters).length > 0, grouping = groupBy ? true : false;

        const filtered = filter ? filteredData : dataArray;
        const groupFiltered = grouping ? groupData(filtered, groupBy) : [];

        const aggKeys = DisplayColumn.filter(fil => (
            filterableText(fil.Fied_Data) === "number"
        )).map(col => col.Field_Name);

        const groupAggregations = groupFiltered.map(grp => {
            return {
                ...grp,
                ...Object.fromEntries(
                    aggKeys.map(key => [
                        key,
                        Division(
                            grp?.groupedData?.reduce(
                                (acc, colmn) => Addition(acc, toNumber(colmn[key]) || 0),
                                0
                            ),
                            grp.groupedData.length
                        )
                    ])
                )
            }
        });

        return grouping ? groupAggregations : filtered
    }, [filters, dataArray, filteredData, groupBy, DisplayColumn])

    useEffect(() => {
        applyFilters();
    }, [filters]);

    const handleFilterChange = (column, value) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [column]: value,
        }));
    };

    const applyFilters = () => {
        let filtered = [...dataArray];
        for (const column of sortedCoulumns) {
            if (filters[column.Field_Name]) {
                if (filters[column.Field_Name].type === 'range') {
                    const { min, max } = filters[column.Field_Name];
                    filtered = filtered.filter(item => {
                        const value = item[column.Field_Name];
                        return (min === undefined || value >= min) && (max === undefined || value <= max);
                    });
                } else if (filters[column.Field_Name].type === 'date') {
                    const { start, end } = filters[column.Field_Name].value;
                    filtered = filtered.filter(item => {
                        const dateValue = new Date(item[column.Field_Name]);
                        return (start === undefined || dateValue >= new Date(start)) && (end === undefined || dateValue <= new Date(end));
                    });
                } else if (Array.isArray(filters[column.Field_Name])) {
                    filtered = filters[column.Field_Name]?.length > 0 ? filtered.filter(item => filters[column.Field_Name].includes(item[column.Field_Name]?.toLowerCase().trim())) : filtered
                }
            }
        }
        setFilteredData(filtered);
    };

    const renderFilter = (column) => {
        const { Field_Name, Fied_Data } = column;
        if (Fied_Data === 'number') {
            return (
                <div className='d-flex justify-content-between px-2'>
                    <input
                        placeholder="Min"
                        type="number"
                        className="bg-light border-0 m-1 p-1 w-50"
                        value={filters[Field_Name]?.min ?? ''}
                        onChange={(e) => handleFilterChange(Field_Name, { type: 'range', ...filters[Field_Name], min: e.target.value ? parseFloat(e.target.value) : undefined })}
                    />
                    <input
                        placeholder="Max"
                        type="number"
                        className="bg-light border-0 m-1 p-1 w-50"
                        value={filters[Field_Name]?.max ?? ''}
                        onChange={(e) => handleFilterChange(Field_Name, { type: 'range', ...filters[Field_Name], max: e.target.value ? parseFloat(e.target.value) : undefined })}
                    />
                </div>
            );
        } else if (Fied_Data === 'date') {
            return (
                <div className='d-flex justify-content-between px-2'>
                    <input
                        placeholder="Start Date"
                        type="date"
                        className="bg-light border-0 m-1 p-1 w-50"
                        value={filters[Field_Name]?.value?.start ?? ''}
                        onChange={(e) => handleFilterChange(Field_Name, { type: 'date', value: { ...filters[Field_Name]?.value, start: e.target.value || undefined } })}
                    />
                    <input
                        placeholder="End Date"
                        type="date"
                        className="bg-light border-0 m-1 p-1 w-50"
                        value={filters[Field_Name]?.value?.end ?? ''}
                        onChange={(e) => handleFilterChange(Field_Name, { type: 'date', value: { ...filters[Field_Name]?.value, end: e.target.value || undefined } })}
                    />
                </div>
            );
        } else if (Fied_Data === 'string') {
            const distinctValues = [...new Set(dataArray.map(item => item[Field_Name]?.toLowerCase()?.trim()))];
            return (
                <Autocomplete
                    multiple
                    id={`${Field_Name}-filter`}
                    options={distinctValues}
                    disableCloseOnSelect
                    getOptionLabel={option => option}
                    value={filters[Field_Name] || []}
                    onChange={(event, newValue) => handleFilterChange(Field_Name, newValue)}
                    renderOption={(props, option, { selected }) => (
                        <li {...props}>
                            <Checkbox
                                icon={icon}
                                checkedIcon={checkedIcon}
                                style={{ marginRight: 8 }}
                                checked={selected}
                            />
                            {option}
                        </li>
                    )}
                    isOptionEqualToValue={(opt, val) => opt === val}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={Field_Name}
                            placeholder={`Select ${Field_Name?.replace(/_/g, ' ')}`}
                        />
                    )}
                />
            );
        }
    };

    const closeDialog = () => {
        setDialog(false);
        setFilterDialog(false);
    }

    return (
        <Fragment>
            {/* <div className="row">
                <div className="col-xxl-10 col-lg-9 col-md-8">
                    
                </div>

                <div className="col-xxl-2 col-lg-3 col-md-4 d-none d-md-block">
                    <h5 className="d-flex justify-content-between px-2">
                        <span>Filters</span>
                        <span>
                            <Tooltip title='Column Visiblity'>
                                <IconButton
                                    size="small"
                                    onClick={() => setDialog(true)}
                                >
                                    <Settings />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title='Clear Filters'>
                                <IconButton
                                    size="small"
                                    onClick={() => setFilters({})}
                                >
                                    <FilterAltOff />
                                </IconButton>
                            </Tooltip>
                        </span>
                    </h5>
                    <div className="border rounded-3 " style={{ maxHeight: '58vh', overflow: 'auto' }}>
                        {DisplayColumn.map((column, ke) => (
                            <div key={ke} className="py-3 px-3 hov-bg border-bottom">
                                <label className='mt-2 mb-1'>{column?.Field_Name?.replace(/_/g, ' ')}</label>
                                {renderFilter(column)}
                            </div>
                        ))}
                        <br />
                    </div>
                </div>

            </div> */}

            <FilterableTable
                title="LOL - Sales Reports"
                headerFontSizePx={12}
                bodyFontSizePx={12}
                ButtonArea={
                    <>
                        <Tooltip title='Column Visiblity'>
                            <IconButton
                                size="small"
                                onClick={() => setDialog(true)}
                            >
                                <Settings />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title='Clear Filters'>
                            <IconButton
                                size="small"
                                onClick={() => setFilters({})}
                            >
                                <FilterAltOff />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Filters">
                            <IconButton
                                onClick={() => setFilterDialog(true)}
                                size="small"
                            // className="d-md-none d-inline"
                            >
                                <FilterAlt />
                            </IconButton>
                        </Tooltip>
                        <select
                            className="cus-inpt p-2 w-auto m-1"
                            value={groupBy}
                            onChange={e => setGroupBy(e.target.value)}
                        >
                            <option value="">Group By</option>
                            {DisplayColumn.filter(fil => (
                                filterableText(fil.Fied_Data) === "string"
                                && fil?.Field_Name !== 'Ledger_Name'
                            )).map((col, colInd) => (
                                <option value={col?.Field_Name} key={colInd}>{col?.Field_Name?.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </>
                }
                ExcelPrintOption
                columns={
                    groupBy
                        ? DisplayColumn.filter(fil =>
                            showData.length > 0 && Object.keys(showData[0]).includes(fil.Field_Name)
                        ).map(col => ({
                            ...col,
                            ColumnHeader: col.Field_Name === groupBy ? groupBy : col.ColumnHeader
                        }))
                        : DisplayColumn
                }
                dataArray={showData}
                isExpendable={true}
                expandableComp={({ row }) => (
                    groupBy ? (
                        <FilterableTable
                            title={row[groupBy] + ' - Ledgers'}
                            dataArray={Array.isArray(row?.groupedData) ? row?.groupedData : []}
                            columns={DisplayColumn}
                            ExcelPrintOption
                            isExpendable={true}
                            expandableComp={({ row }) => (
                                <LedgerDetails
                                    row={row}
                                    DB={DB}
                                    Fromdate={Fromdate}
                                    Todate={Todate}
                                />
                            )}
                        />
                    ) : (
                        <LedgerDetails
                            row={row}
                            DB={DB}
                            Fromdate={Fromdate}
                            Todate={Todate}
                        />
                    )
                )}
                maxHeightOption
            />

            <Dialog
                open={filterDialog}
                onClose={closeDialog}
                maxWidth='sm' fullWidth
            >
                <DialogContent>
                    <h5 className="d-flex justify-content-between px-2">
                        <span>Filters</span>
                        <span>
                            <Tooltip title='Column Visiblity'>
                                <IconButton
                                    size="small"
                                    onClick={() => setDialog(true)}
                                >
                                    <Settings />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title='Clear Filters'>
                                <IconButton
                                    size="small"
                                    onClick={() => setFilters({})}
                                >
                                    <FilterAltOff />
                                </IconButton>
                            </Tooltip>
                        </span>
                    </h5>
                    <div className="border rounded-3 " >
                        {DisplayColumn.map((column, ke) => (
                            <div key={ke} className="py-3 px-3 hov-bg border-bottom">
                                <label className='mt-2 mb-1'>{column?.Field_Name?.replace(/_/g, ' ')}</label>
                                {renderFilter(column)}
                            </div>
                        ))}
                        <br />
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog} color='error'>close</Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={dialog}
                onClose={() => setDialog(false)}
                maxWidth='lg' fullWidth
            >
                <DialogTitle>Column Settings</DialogTitle>
                <DialogContent>
                    <div className="row">
                        {columns.map((o, i) => (
                            <div className="col-lg-4 col-md-6 p-2" key={i}>
                                <Card
                                    component={Paper}
                                    className={`p-2 d-flex justify-content-between align-items-center flex-wrap ${i % 2 !== 0 ? 'bg-light' : ''}`}
                                >
                                    <div className='d-flex justify-content-between align-items-center flex-wrap'>
                                        <Switch
                                            checked={Boolean(o?.isDefault) || Boolean(o?.isVisible)}
                                            disabled={Boolean(o?.isDefault)}
                                            onChange={e =>
                                                setColumns(prevColumns =>
                                                    prevColumns.map(oo =>
                                                        oo.Field_Name === o?.Field_Name
                                                            ? { ...oo, isVisible: e.target.checked ? 1 : 0 }
                                                            : oo
                                                    )
                                                )}
                                        />

                                        <h6 className='fa-13 mb-0 fw-bold '>{o?.Field_Name}</h6>
                                    </div>
                                    <input
                                        type='number'
                                        value={checkIsNumber(o?.OrderBy) ? o?.OrderBy : ''}
                                        onChange={e =>
                                            setColumns(prevColumns =>
                                                prevColumns.map(oo =>
                                                    oo.Field_Name === o?.Field_Name
                                                        ? { ...oo, OrderBy: e.target.value }
                                                        : oo
                                                )
                                            )
                                        }
                                        label={'Order Value'}
                                        className='mt-2 p-1 border-0 cus-inpt'
                                        style={{ width: '80px' }}
                                        placeholder='Order'
                                    />
                                </Card>
                            </div>
                        ))}
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setColumns(propsColumns)} variant="outlined">Reset</Button>
                    <Button onClick={() => setDialog(false)} color='error'>close</Button>
                </DialogActions>
            </Dialog>

        </Fragment>
    )

}

export default LedgerBasedSalesReport;


















// const ledgerAndTransactionExport = (excludeDetails, transactions) => {
//     const wb = XLSX.utils.book_new();

//     const excludeDetailsSheet = XLSX.utils.json_to_sheet(excludeDetails);
//     XLSX.utils.book_append_sheet(wb, excludeDetailsSheet, 'Sheet1');

//     const transactionsSheet = XLSX.utils.json_to_sheet(transactions);
//     XLSX.utils.book_append_sheet(wb, transactionsSheet, 'Sheet2');

//     XLSX.writeFile(wb, 'exported_data.xlsx');
// };


// {
//     Field_Name: "Excel_Export",
//     Fied_Data: "string",
//     isVisible: 1,
//     OrderBy: 1,
//     isCustomCell: true,
//     Cell: ({ row }) => {
//         const excludeDetails = Object.fromEntries(
//             Object.entries(row).filter(([key]) => key !== 'LedgerSales' && DisplayColumn.find(colKey => colKey === key))
//         );
//         return (
//             <>
//                 <IconButton
//                     size="small"
//                     onClick={() => {
//                         ledgerAndTransactionExport([excludeDetails], row.LedgerSales);
//                     }}
//                 >
//                     <Download />
//                 </IconButton>
//             </>
//         )
//     }
// },





// const columnsInitialValue = [
//     { Field_Name: "Ledger_Name", Fied_Data: "string", isVisible: 1, isDefault: 1, OrderBy: 4 },
//     { Field_Name: "Total_Qty", Fied_Data: "number", isVisible: 1, isDefault: 0, OrderBy: 5 },
//     { Field_Name: "ALL_Avg_M2", Fied_Data: "number", isVisible: 1, isDefault: 0, OrderBy: 3, ColumnHeader: 'M2' },
//     { Field_Name: "ALL_Avg_M3", Fied_Data: "number", isVisible: 0, isDefault: 0, OrderBy: 6, ColumnHeader: 'M3' },
//     { Field_Name: "ALL_Avg_M6", Fied_Data: "number", isVisible: 1, isDefault: 0, OrderBy: 2, ColumnHeader: 'M6' },
//     { Field_Name: "ALL_Avg_M9", Fied_Data: "number", isVisible: 0, isDefault: 0, OrderBy: 7, ColumnHeader: 'M9' },
//     { Field_Name: "ALL_Avg_One_Year", Fied_Data: "number", isVisible: 1, isDefault: 0, OrderBy: 1, ColumnHeader: 'Y1' },
//     { Field_Name: "Q_Pay_Days", Fied_Data: "number", isVisible: 0, isDefault: 0, OrderBy: null },
//     { Field_Name: "Freq_Days", Fied_Data: "number", isVisible: 0, isDefault: 0, OrderBy: null },
//     { Field_Name: "Ledger_Alias", Fied_Data: "string", isVisible: 0, isDefault: 0, OrderBy: null },
//     { Field_Name: "Actual_Party_Name_with_Brokers", Fied_Data: "string", isVisible: 0, isDefault: 0, OrderBy: null },
//     { Field_Name: "Party_Name", Fied_Data: "string", isVisible: 0, isDefault: 0, OrderBy: null },
//     { Field_Name: "Party_Location", Fied_Data: "string", isVisible: 0, isDefault: 0, OrderBy: null },
//     { Field_Name: "Party_Nature", Fied_Data: "string", isVisible: 0, isDefault: 0, OrderBy: null },
//     { Field_Name: "Party_Group", Fied_Data: "string", isVisible: 0, isDefault: 0, OrderBy: null },
//     { Field_Name: "Ref_Brokers", Fied_Data: "string", isVisible: 0, isDefault: 0, OrderBy: null },
//     { Field_Name: "Ref_Owners", Fied_Data: "string", isVisible: 0, isDefault: 0, OrderBy: null },
//     { Field_Name: "Party_Mobile_1", Fied_Data: "string", isVisible: 0, isDefault: 0, OrderBy: null },
//     { Field_Name: "Party_Mobile_2", Fied_Data: "string", isVisible: 0, isDefault: 0, OrderBy: null },
//     { Field_Name: "Party_District", Fied_Data: "string", isVisible: 0, isDefault: 0, OrderBy: null },
//     { Field_Name: "File_No", Fied_Data: "string", isVisible: 0, isDefault: 0, OrderBy: null },
//     { Field_Name: "Payment_Mode", Fied_Data: "string", isVisible: 0, isDefault: 0, OrderBy: null },
//     { Field_Name: "A2", Fied_Data: "string", isVisible: 0, isDefault: 0, OrderBy: null },
//     { Field_Name: "A3", Fied_Data: "string", isVisible: 0, isDefault: 0, OrderBy: null },
//     { Field_Name: "A4", Fied_Data: "string", isVisible: 0, isDefault: 0, OrderBy: null },
//     { Field_Name: "M2_Avg_Amo", Fied_Data: "number", isVisible: 0, isDefault: 0, OrderBy: null },
//     { Field_Name: "M3_Avg_Amo", Fied_Data: "number", isVisible: 0, isDefault: 0, OrderBy: null },
//     { Field_Name: "M6_Avg_Amo", Fied_Data: "number", isVisible: 0, isDefault: 0, OrderBy: null },
//     { Field_Name: "M9_Avg_Amo", Fied_Data: "number", isVisible: 0, isDefault: 0, OrderBy: null },
//     { Field_Name: "Y_Avg_Amo", Fied_Data: "number", isVisible: 0, isDefault: 0, OrderBy: null },
//     { Field_Name: "Q_Pay_Group", Fied_Data: "string", isVisible: 0, isDefault: 0, OrderBy: null },
//     { Field_Name: "Ledger_Tally_Id", Fied_Data: "number", isVisible: 0, isDefault: 0, OrderBy: null }
// ].sort((a, b) => a.OrderBy - b.OrderBy);