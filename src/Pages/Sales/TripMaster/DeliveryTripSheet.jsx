import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Tooltip } from "@mui/material";
import FilterableTable, { ButtonActions, createCol } from "../../../Components/filterableTable2";
import { useNavigate, useLocation } from "react-router-dom";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ISOString, isValidDate, LocalDate, LocalTime, NumberFormat, numberToWords, Subraction, timeDuration } from "../../../Components/functions";
import { Download, Edit, FilterAlt, Search, Visibility } from "@mui/icons-material";
import { fetchLink } from "../../../Components/fetchComponent";
import { useReactToPrint } from 'react-to-print';
import Select from 'react-select';
import { customSelectStyles } from "../../../Components/tablecolumn";

const useQuery = () => new URLSearchParams(useLocation().search);
const defaultFilters = {
    Fromdate: ISOString(),
    Todate: ISOString(),
};

const TripSheets = ({ loadingOn, loadingOff }) => {

    const nav = useNavigate();
    const location = useLocation();
    const query = useQuery();
    const [tripData, setTripData] = useState([]);
    const [filters, setFilters] = useState({
        Fromdate: defaultFilters.Fromdate,
        Todate: defaultFilters.Todate,
        fetchFrom: defaultFilters.Fromdate,
        fetchTo: defaultFilters.Todate,
        filterDialog: false,
        refresh: false,
        printPreviewDialog: false,
        shortPreviewDialog: false,
        FromGodown: [],
        ToGodown: [],
        Staffs: [],
        Items: []
    });
    const [selectedRow, setSelectedRow] = useState([]);
    const printRef = useRef(null);


    useEffect(() => {
        if (loadingOn) loadingOn();

        fetchLink({
            address: `delivery/deliveryTripSheet?Fromdate=${filters?.fetchFrom}&Todate=${filters?.fetchTo}`,
        }).then(data => {
            if (data.success) {

                setTripData(data.data);
            }
        }).finally(() => {
            if (loadingOff) loadingOff();
        }).catch(e => console.error(e))
    }, [filters?.fetchFrom, filters?.fetchTo]);

    useEffect(() => {
        const queryFilters = {
            Fromdate: query.get("Fromdate") && isValidDate(query.get("Fromdate"))
                ? query.get("Fromdate")
                : defaultFilters.Fromdate,
            Todate: query.get("Todate") && isValidDate(query.get("Todate"))
                ? query.get("Todate")
                : defaultFilters.Todate,
        };
        setFilters(pre => ({ ...pre, fetchFrom: queryFilters.Fromdate, fetchTo: queryFilters.Todate }));
    }, [location.search]);

    const updateQueryString = (newFilters) => {
        const params = new URLSearchParams(newFilters);
        nav(`?${params.toString()}`, { replace: true });
    };

    const closeDialog = () => {
        setFilters({
            ...filters,
            filterDialog: false,
        });
    }





    // const Total_Invoice_value = tripData.reduce((acc, orders) => {
    //     const invoiceValue = orders?.Product_Array?.reduce((sum, product) => {
    //         return sum + (product?.Total_Invoice_value || 0);
    //     }, 0);

    //     return acc + (invoiceValue || 0);
    // }, 0);


    const allProducts = (selectedRow?.Product_Array || []).flatMap(product => product.Products_List || []);


    const TaxData = allProducts.reduce((data, item) => {
        const HSNindex = data.findIndex(obj => obj.hsnCode === item.HSN_Code);

        const {
            HSN_Code,
            Taxable_Amount = 0,
            Igst_Amo = 0,
            Cgst_Amo = 0,
            Sgst_Amo = 0
        } = item;

        const Total_Tax = Igst_Amo + Cgst_Amo + Sgst_Amo;

        if (HSNindex !== -1) {

            data[HSNindex] = {
                ...data[HSNindex],
                taxableValue: data[HSNindex].taxableValue + Taxable_Amount,
                igst: data[HSNindex].igst + Igst_Amo,
                cgst: data[HSNindex].cgst + Cgst_Amo,
                sgst: data[HSNindex].sgst + Sgst_Amo,
                totalBeforeTax: data[HSNindex].totalBeforeTax + Taxable_Amount,
                totalTax: data[HSNindex].totalTax + Total_Tax
            };
        } else {
            data.push({
                hsnCode: HSN_Code,
                taxableValue: Taxable_Amount,
                igst: Igst_Amo,
                cgst: Cgst_Amo,
                sgst: Sgst_Amo,
                totalBeforeTax: Taxable_Amount,
                totalTax: Total_Tax
            });
        }

        return data;
    }, []);



    const handlePrint = useReactToPrint({
        content: () => printRef.current,
    });




    const uniqueStaffs = useMemo(() => {
        const allStaffs = tripData.flatMap((trip) =>
            trip.Employees_Involved.map((staff) => staff.Emp_Name)
        );
        return [...new Set(allStaffs)].map((name) => ({
            value: name,
            label: name,
        }));
    }, [tripData]);

    const filteredData = useMemo(() => {
        return tripData.filter(trip => {
            const hasFromGodownMatch = filters.FromGodown.length > 0
                ? trip.Product_Array.some(product =>
                    filters.FromGodown.some(selected => selected.value === product.FromLocation)
                )
                : false;

            const hasToGodownMatch = filters.ToGodown.length > 0
                ? trip.Product_Array.some(product =>
                    filters.ToGodown.some(selected => selected.value === product.ToLocation)
                )
                : false;

            const hasItemMatch = filters.Items.length > 0
                ? trip.Product_Array.some(product =>
                    filters.Items.some(selected => selected.value === product.Product_Name)
                )
                : false;

            const hasEmployeeMatch = filters.Staffs.length > 0
                ? trip.Employees_Involved.some(staff =>
                    filters.Staffs.some(selected => selected.value === staff.Emp_Name)
                )
                : false;

            return hasFromGodownMatch || hasToGodownMatch || hasItemMatch || hasEmployeeMatch;
        });
    }, [tripData, filters]);





    const flattenProductsList = (productArray) => {
        if (!Array.isArray(productArray)) return [];

        return productArray.flatMap((product) =>
            Array.isArray(product.Products_List)
                ? product.Products_List
                    .map((item) => ({
                        ...item,
                        Reason: product.Reason || "Delivery",
                    }))
                    .filter(item => Object.keys(item).length > 1)
                : []
        ).filter(row => row && Object.keys(row).length > 1);
    };


    return (
        <>

            <FilterableTable
                dataArray={(
                    filters.FromGodown.length > 0 ||
                    filters.ToGodown.length > 0 ||
                    filters.Staffs.length > 0
                ) ? filteredData : tripData}
                title="Trip Sheets"
                maxHeightOption
                ExcelPrintOption
                ButtonArea={
                    <>
                        <Button
                            variant="outlined"
                            onClick={() => nav('/erp/sales/Tripsheet/Tripsheetcreation')}
                        >Add</Button>
                        <Tooltip title='Filters'>
                            <IconButton
                                size="small"
                                onClick={() => setFilters({ ...filters, filterDialog: true })}
                            ><FilterAlt /></IconButton>
                        </Tooltip>
                    </>
                }
                EnableSerialNumber
                initialPageCount={10}
                columns={[
                    createCol('Trip_Date', 'date', 'Date'),
                    createCol('Trip_No', 'string'),
                    createCol('Challan_No', 'string', 'Challan'),
                    createCol('Vehicle_No', 'string', 'Vehicle'),
                    createCol('StartTime', 'time', 'Start Time'),
                    createCol('EndTime', 'time', 'End Time'),
                    {
                        isVisible: 1,
                        ColumnHeader: 'Time Taken',
                        isCustomCell: true,
                        Cell: ({ row }) => {
                            const startTime = row?.StartTime ? new Date(row.StartTime) : '';
                            const endTime = row.EndTime ? new Date(row.EndTime) : '';
                            const timeTaken = (startTime && endTime) ? timeDuration(startTime, endTime) : '00:00';
                            return (
                                <span className="cus-badge bg-light">{timeTaken}</span>
                            )
                        }
                    },
                    {
                        isVisible: 1,
                        ColumnHeader: 'Distance',
                        isCustomCell: true,
                        Cell: ({ row }) => NumberFormat(Subraction(row?.Trip_EN_KM, row?.Trip_ST_KM))
                    },
                    {
                        isVisible: 1,
                        ColumnHeader: 'Total Qty',
                        isCustomCell: true,
                        Cell: ({ row }) => {

                            const totalQty = row?.Product_Array?.reduce((sum, product) => {

                                const productQty = product?.Products_List?.reduce((productSum, item) => {
                                    return productSum + (item.Bill_Qty || 0);
                                }, 0);
                                return sum + productQty;
                            }, 0);


                            return <span>{totalQty}</span>;
                        },
                    },

                    {
                        isVisible: 1,
                        ColumnHeader: 'Total Item',
                        isCustomCell: true,
                        Cell: ({ row }) => {

                            const totalQty = row?.Product_Array?.reduce((sum, product) => {

                                const productQty = product?.Products_List?.reduce((productSum, item) => {
                                    return productSum + 1;
                                }, 0);
                                return sum + productQty;
                            }, 0);


                            return <span>{totalQty}</span>;
                        },
                    },
                    {
                        isVisible: 1,
                        ColumnHeader: 'Action',
                        isCustomCell: true,
                        Cell: ({ row }) => (
                            <ButtonActions
                                buttonsData={[
                                    {
                                        name: 'Edit',
                                        icon: <Edit className="fa-14" />,
                                        onclick: () => nav('/erp/sales/Tripsheet/Tripsheetcreation', {
                                            state: {
                                                ...row,
                                                isEditable: false,
                                            },
                                        }),
                                    },
                                    {
                                        name: 'Short Preview',
                                        icon: <Visibility className="fa-14" />,
                                        onclick: () => {
                                            setFilters(pre => ({ ...pre, shortPreviewDialog: true }));

                                            setSelectedRow(row);
                                        }
                                    },
                                    {
                                        name: 'Preview',
                                        icon: <Visibility className="fa-14" />,
                                        onclick: () => {
                                            setFilters(pre => ({ ...pre, printPreviewDialog: true }));
                                            setSelectedRow(row);
                                        }
                                    },
                                ]}
                            />
                        )
                    }
                ]}
                isExpendable={true}
                expandableComp={({ row }) => (
                    <>
                        {row?.Employees_Involved?.length > 0 && (
                            <table className="fa-14">
                                <tbody>
                                    <tr>
                                        <th className="py-1 px-2 border text-muted" colSpan={3}>Involved Employees</th>
                                    </tr>
                                    <tr>
                                        <th className="py-1 px-2 border text-muted">SNo</th>
                                        <th className="py-1 px-2 border text-muted">Name</th>
                                        <th className="py-1 px-2 border text-muted">Role</th>
                                    </tr>
                                    {row.Employees_Involved.map((o, i) => (
                                        <tr key={i}>
                                            <td className="py-1 px-2 border">{i + 1}</td>
                                            <td className="py-1 px-2 border">{o?.Emp_Name}</td>
                                            <td className="py-1 px-2 border">{o?.Cost_Category}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}


                        <FilterableTable
                            title="Items"
                            EnableSerialNumber
                            dataArray={
                                Array.isArray(row?.Product_Array)
                                    ? flattenProductsList(row?.Product_Array).filter(row => Object.keys(row).length > 1)
                                    : []
                            }
                            columns={[
                                {
                                    isVisible: 1,
                                    ColumnHeader: 'Reason',
                                    isCustomCell: true,
                                    Cell: ({ row }) => row.Reason ?? 'Delivery',
                                },
                                createCol('Product_Name', 'string', 'Product_Name'),
                                createCol('HSN_Code', 'string'),
                                createCol('Taxable_Rate', 'number', 'Taxable_Rate'),
                                createCol('Taxable_Amount', 'number', 'Tax_Before_Amount'),
                                {
                                    isVisible: 1,
                                    ColumnHeader: 'Tax',
                                    isCustomCell: true,
                                    Cell: ({ row }) => {
                                        const cgstP = Number(row.Cgst_Amo) || 0;
                                        const sgstP = Number(row.Sgst_Amo) || 0;
                                        const taxValue = cgstP + sgstP;
                                        return taxValue.toFixed(2);
                                    },
                                },
                                createCol('Final_Amo', 'number', 'Final_Amo'),
                                {
                                    isVisible: 1,
                                    ColumnHeader: 'Round off',
                                    isCustomCell: true,
                                    Cell: ({ row }) => {
                                        const total = Number(row.Total_Value) || 0;
                                        const integerPart = Math.floor(total);
                                        const decimalPart = total - integerPart;

                                        let roundedTotal = integerPart;
                                        let roundOffDiff = 0;

                                        if (decimalPart >= 0.56 && decimalPart <= 0.99) {
                                            roundedTotal = integerPart + 1;
                                        } else if (decimalPart >= 0.05 && decimalPart <= 0.55) {
                                            roundedTotal = integerPart;
                                        } else if (decimalPart >= 0.00 && decimalPart <= 0.04) {
                                            roundedTotal = integerPart;
                                        }

                                        roundOffDiff = (roundedTotal - total).toFixed(2);
                                        return roundOffDiff > 0 ? `+${roundOffDiff}` : roundOffDiff;
                                    },
                                },
                                createCol('Branch', 'string', 'From'),
                                createCol('Retailer_Name', 'string', 'To'),
                            ]}
                            disablePagination
                            ExcelPrintOption
                        />


                    </>
                )}
            />


            <Dialog
                open={filters.filterDialog}
                onClose={closeDialog}
                fullWidth maxWidth='md'
            >
                <DialogTitle>Filters</DialogTitle>
                <DialogContent>
                    <div className="table-responsive pb-4">
                        <table className="table">
                            <tbody>

                                <tr>
                                    <td style={{ verticalAlign: 'middle' }}>From</td>
                                    <td>
                                        <input
                                            type="date"
                                            value={filters.Fromdate}
                                            onChange={e => setFilters({ ...filters, Fromdate: e.target.value })}
                                            className="cus-inpt"
                                        />
                                    </td>
                                    <td style={{ verticalAlign: 'middle' }}>To</td>
                                    <td>
                                        <input
                                            type="date"
                                            value={filters.Todate}
                                            onChange={e => setFilters({ ...filters, Todate: e.target.value })}
                                            className="cus-inpt"
                                        />
                                    </td>
                                </tr>

                                <tr>
                                    <td style={{ verticalAlign: 'middle' }}>Staffs</td>
                                    <td colSpan={3}>
                                        <Select
                                            value={filters.Staffs}
                                            onChange={(selectedOptions) =>
                                                setFilters((prev) => ({ ...prev, Staffs: selectedOptions }))
                                            }
                                            menuPortalTarget={document.body}
                                            options={uniqueStaffs}
                                            isMulti
                                            styles={customSelectStyles}
                                            isSearchable={true}
                                            placeholder={"Select Staff"}
                                            maxMenuHeight={300}
                                        />
                                    </td>
                                </tr>

                                {/* <tr>
                                    <td style={{ verticalAlign: 'middle' }}>Items</td>
                                    <td colSpan={3}>
                                        <Select
                                            value={filters.Items}
                                            onChange={(selectedOptions) =>
                                                setFilters((prev) => ({ ...prev, Items: selectedOptions }))
                                            }
                                            menuPortalTarget={document.body}
                                            options={uniqueItems}
                                            isMulti
                                            styles={customSelectStyles}
                                            isSearchable={true}
                                            placeholder={"Select Items"}
                                            maxMenuHeight={300}
                                        />
                                    </td>
                                </tr> */}


                            </tbody>
                        </table>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog}>close</Button>
                    <Button
                        onClick={() => {
                            const updatedFilters = {
                                Fromdate: filters?.Fromdate,
                                Todate: filters?.Todate
                            };
                            updateQueryString(updatedFilters);
                            closeDialog();
                        }}
                        startIcon={<Search />}
                        variant="outlined"
                    >Search</Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={filters.shortPreviewDialog}
                onClose={() => setFilters(pre => ({ ...pre, shortPreviewDialog: false }))}
                maxWidth="xl"
                fullWidth
            >
                <DialogTitle>Print Preview</DialogTitle>
                <DialogContent ref={printRef}>
                    {selectedRow?.Product_Array && (
                        <React.Fragment>
                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th className="fa-12 bg-light">Retailer Name</th>

                                        <th className="fa-12 bg-light">Amount</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {selectedRow.Product_Array.length > 0 ? (
                                        selectedRow.Product_Array.map((group, idx) => {

                                            const totalAmount = group.Products_List.reduce((sum, product) => sum + product.Final_Amo, 0);

                                            return (
                                                <React.Fragment key={idx}>
                                                    <tr>
                                                        <td className="fw-bold">{group.Retailer_Name}</td>

                                                        <td className="fw-bold text-end">
                                                            {NumberFormat(totalAmount)}
                                                        </td>
                                                    </tr>
                                                </React.Fragment>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="text-center">
                                                No data available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </React.Fragment>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setFilters(pre => ({ ...pre, shortPreviewDialog: false }))}
                        variant="outlined"
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>



            <Dialog
                open={filters.printPreviewDialog}
                onClose={() => setFilters(pre => ({ ...pre, printPreviewDialog: false }))}
                maxWidth="xl"
                fullWidth
            >
                <DialogTitle>Print Preview</DialogTitle>
                <DialogContent ref={printRef}>
                    {selectedRow?.Product_Array && (
                        <React.Fragment>
                            <table className="table table-bordered fa-13 m-0">
                                <tbody>
                                    <tr>
                                        <td colSpan={3}>DELIVERY CHALLAN</td>
                                        <td colSpan={3}>GSTIN :33AAOCP0807F1ZN</td>
                                        <td colSpan={2}>ORIGINAL / DUPLICATE</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={3} rowSpan={2}>
                                            <span className="fa-14 fw-bold">PUKAL FOODS PRIVATE LIMITED</span> <br />
                                            6A, First Floor, North, Viswanadha puram, Main road,<br />
                                            Reserve Line, Viswanathapuram, Madurai, Tamil Nadu 625014
                                        </td>
                                        <td colSpan={3}>FSSAI No :</td>
                                        <td>Challan No</td>
                                        <td>{selectedRow?.Challan_No}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={3}>Phone No: 9842131353, 9786131353</td>
                                        <td>Date</td>
                                        <td>{selectedRow.Trip_Date ? LocalDate(selectedRow.Trip_Date) : ''}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={8} className="text-center">Reason for Transfer - Branch Transfer / Line Sales / Purchase Return / Job Work</td>
                                    </tr>
                                    <tr>
                                        <td>Vehicle No</td>
                                        <td>{selectedRow?.Vehicle_No}</td>
                                        <td>Delivery Person </td>
                                        <td>
                                            {selectedRow?.Employees_Involved?.filter(staff => (
                                                staff?.Cost_Category === 'Delivery Man'
                                            ))?.map(staff => staff?.Emp_Name).join(', ')}
                                        </td>
                                        <td>Start Time</td>
                                        <td>{selectedRow?.StartTime ? LocalTime(new Date(selectedRow.StartTime)) : ''}</td>
                                        <td>Start KM</td>
                                        <td>{selectedRow?.Trip_ST_KM}</td>
                                    </tr>
                                    <tr>
                                        <td>Trip No</td>
                                        <td>{selectedRow?.Trip_No}</td>
                                        <td>LoadMan</td>
                                        <td>
                                            {selectedRow?.Employees_Involved?.filter(staff => (
                                                staff?.Cost_Category === 'Load Man'
                                            ))?.map(staff => staff?.Emp_Name).join(', ')}
                                        </td>
                                        <td>End Time</td>
                                        <td>{selectedRow?.EndTime ? LocalTime(new Date(selectedRow.EndTime)) : ''}</td>
                                        <td>End KM</td>
                                        <td>{selectedRow?.Trip_EN_KM}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* items */}
                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th className="fa-12 bg-light">#</th>
                                        <th className="fa-12 bg-light">Reason</th>
                                        <th className="fa-12 bg-light">Party</th>
                                        <th className="fa-12 bg-light">Address</th>
                                        <th className="fa-12 bg-light">Item</th>
                                        <th className="fa-12 bg-light">HSN</th>
                                        <th className="fa-12 bg-light">Qty</th>
                                        <th className="fa-12 bg-light">KGS</th>
                                        <th className="fa-12 bg-light">Rate</th>
                                        <th className="fa-12 bg-light">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>

                                    {selectedRow?.Product_Array?.map((product, productIndex) => (
                                        (product?.Products_List || []).map((item, index) => (
                                            <tr key={`${productIndex}-${index}`}>
                                                <td className="fa-10">{index + 1}</td>
                                                <td className="fa-10">{item.Reason || "Delivery"}</td>
                                                <td className="fa-10">{item?.Retailer_Name}</td>
                                                <td className="fa-10">{item?.Retailer_Address}</td>
                                                <td className="fa-10">{item?.Product_Name}</td>
                                                <td className="fa-10">{item?.HSN_Code}</td>
                                                <td className="fa-10">{NumberFormat(item?.Bill_Qty)}</td>
                                                <td className="fa-10">{NumberFormat(item?.KGS || 0)}</td>
                                                <td className="fa-10">{NumberFormat(item?.Taxable_Rate)}</td>
                                                <td className="fa-10">{NumberFormat(item?.Taxable_Rate * item?.Bill_Qty)}</td>
                                            </tr>
                                        ))
                                    ))}
                                </tbody>
                            </table>


                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <td className="bg-light fa-12 text-center">HSN / SAC</td>
                                        <td className="bg-light fa-12 text-center">Taxable Value</td>
                                        <td className="bg-light fa-12 text-center">IGST</td>
                                        <td className="bg-light fa-12 text-center">CGST</td>
                                        <td className="bg-light fa-12 text-center">SGST</td>
                                        <td className="bg-light fa-12 text-center">Total Tax</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Map through aggregated data */}

                                    {TaxData.map((item, i) => (
                                        <tr key={i}>
                                            <td className="fa-10 text-end">{item.hsnCode}</td>
                                            <td className="fa-10 text-end">{NumberFormat(item.totalBeforeTax)}</td>
                                            <td className="fa-10 text-end">{NumberFormat(item.igst)}</td>
                                            <td className="fa-10 text-end">{NumberFormat(item.cgst)}</td>
                                            <td className="fa-10 text-end">{NumberFormat(item.sgst)}</td>
                                            <td className="fa-10 text-end">{NumberFormat(item.totalTax)}</td>
                                        </tr>
                                    ))}

                                    {/* Total Row */}
                                    <tr>
                                        <td className="border fa-10 text-end">Total</td>
                                        <td className="border fa-10 text-end fw-bold">
                                            {NumberFormat(TaxData.reduce((sum, item) => sum + item.totalBeforeTax, 0))}
                                        </td>
                                        <td className="border fa-10 text-end fw-bold">
                                            {NumberFormat(TaxData.reduce((sum, item) => sum + item.igst, 0))}
                                        </td>
                                        <td className="border fa-10 text-end fw-bold">
                                            {NumberFormat(TaxData.reduce((sum, item) => sum + item.cgst, 0))}
                                        </td>
                                        <td className="border fa-10 text-end fw-bold">
                                            {NumberFormat(TaxData.reduce((sum, item) => sum + item.sgst, 0))}
                                        </td>
                                        <td className="border fa-10 text-end fw-bold">
                                            {NumberFormat(TaxData.reduce((sum, item) => sum + item.totalTax, 0))}
                                        </td>
                                    </tr>

                                </tbody>
                                <td colSpan={6} className=' fa-13 fw-bold'>

                                    Tax Amount (in words) : INR &nbsp;
                                    {numberToWords(
                                        parseInt(Object.values(selectedRow?.Product_Array).reduce(
                                            (sum, item) => sum + Number(item.Total_Tax || 0), 0
                                        ))
                                    )} only.
                                </td>

                            </table>

                            <table className="table table-bordered fa-10">
                                <tbody>
                                    <tr>
                                        <td>Prepared By</td>
                                        <td style={{ minWidth: 150 }}></td>
                                        <td>Executed By</td>
                                        <td style={{ minWidth: 150 }}></td>
                                        <td>Verified By</td>
                                        <td style={{ minWidth: 150 }}></td>
                                    </tr>
                                    <tr>
                                        <td>Other Expenses</td>
                                        <td>0</td>
                                        <td>Round Off</td>
                                        <td>0</td>
                                        <td>Grand Total</td>
                                        <td className="fa-15 fw-bold">
                                            {/* Calculate Total Value (Taxable Value + Total Tax) */}
                                            {NumberFormat(
                                                Object.values(TaxData).reduce(
                                                    (acc, item) => acc + (item.taxableValue ?? 0) + (item.igst ?? 0) + (item.cgst ?? 0) + (item.sgst ?? 0), 0
                                                )
                                            )}
                                        </td>
                                    </tr>
                                </tbody>

                            </table>

                            <td colSpan={6} className='col-12 fa-15 fw-bold'>
                                {numberToWords(
                                    parseInt(Object.values(TaxData).reduce(
                                        (acc, item) => acc + (item.taxableValue ?? 0) + (item.igst ?? 0) + (item.cgst ?? 0) + (item.sgst ?? 0), 0
                                    ))
                                )} only.
                            </td>
                            <div className="col-12 text-center">
                                <p>This is a Computer Generated Invoice</p>
                            </div>

                        </React.Fragment>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setFilters(pre => ({ ...pre, printPreviewDialog: false }))}
                        variant="outlined"
                    >
                        Close
                    </Button>
                    <Button
                        startIcon={<Download />}
                        variant="outlined"
                        onClick={handlePrint}
                    >
                        Download
                    </Button>
                </DialogActions>
            </Dialog>

            {/* <h6 className="m-0 text-end text-muted px-3">Total Invoice Amount ({tripData?.length}) : {Total_Invoice_value}</h6> */}
        </>
    )
}


export default TripSheets;