import React, { useState, useEffect, Fragment } from "react";
import { Button } from "react-bootstrap";
import { IconButton, Dialog, DialogActions, DialogContent, DialogTitle, Card, CardContent } from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DataTable from 'react-data-table-component'
import { fetchLink } from "../../Components/fetchComponent";
import { decryptPasswordFun, encryptPasswordFun } from "../../Components/functions";
import AddBoxIcon from '@mui/icons-material/AddBox';
import RequiredStar from "../../Components/requiredStar";
import CheckIcon from '@mui/icons-material/Check';
const Td = (prop) => <td className="border-0 fa-14 p-2 vctr">{prop.children}</td>


const Users = ({ loadingOn, loadingOff }) => {
    const parseData = JSON.parse(localStorage.getItem("user"));
    const initialState = {
        UserId: '',
        Name: "",
        UserName: "",
        UserTypeId: "",
        Password: "",
        BranchId: '',
        Company_id: parseData?.Company_id,
    };
    const initialInputValue = {
        Cost_Center_Id: '',
        Cost_Center_Name: '',
        User_Type: '',
        Is_Converted_To_User: 1,
        User_Id: '',
    };

    const [inputValuecost, setInputValuecost] = useState(initialInputValue);
    const [usersData, setUsersData] = useState([]);
    const [screen, setScreen] = useState(false);
    const [reload, setReload] = useState(false);
    const [inputValue, setInputValue] = useState(initialState);
    const [dialog, setDialog] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [filterInput, setFilterInput] = useState('');
    const [filteredData, setFilteredData] = useState([]);
    const [usertypes, setUserType] = useState([])
    const [userTypeDropDown, setUserTypeDropDown] = useState([]);
    const [branch, setBranch] = useState([]);
    const [others, setOthers] = useState({
        dialog: false,
        deleteDialog: false,
        refresh: false,
        filterText: 'ALL'
    });
    useEffect(() => {
        fetchLink({
            address: `masters/users?Company_id=${parseData?.Company_id}`
        }).then((data) => {
            if (data.success) {
                data?.data?.sort((a, b) => a.Name.localeCompare(b.Name));
                setUsersData(data.data);
            }
        }).catch(e => console.error(e))
    }, [reload, parseData?.Company_id]);

    useEffect(() => {
        fetchLink({
            address: `masters/userType?Company_id=${parseData?.Company_id}`,
        }).then((data) => {
            if (data.success) {
                setUserTypeDropDown(data.data);
            }
        })
            .catch((e) => console.error(e));
    }, [parseData?.Company_id]);

    useEffect(() => {
        fetchLink({
            address: `masters/branch/dropDown?Company_id=${parseData?.Company_id}`
        }).then((data) => {
            if (data.success) {
                setBranch(data.data);
            }
        })
            .catch((e) => console.error(e));
    }, [parseData?.Company_id]);

    useEffect(() => {
        if (filterInput) {
            const filteredResults = usersData.filter(item => {
                return Object.values(item).some(value =>
                    String(value).toLowerCase().includes(filterInput.toLowerCase())
                );
            });

            setFilteredData(filteredResults);
        }
    }, [filterInput, usersData])

    const switchScreen = () => {
        setInputValue(initialState);
        setScreen(pre => !pre);
    };

    const saveUser = () => {

        fetchLink({
            address: `masters/users`,
            method: inputValue.UserId ? "PUT" : "POST",
            bodyData: { ...inputValue, Password: encryptPasswordFun(inputValue.Password) },
        }).then((data) => {

            if (data.success) {
                setReload(!reload);
                toast.success(data.message);
                switchScreen();
            } else {
                toast.error(data.message);
            }
        });
    };


    const closeDialog = () => {
        setOthers(prev => ({ ...prev, dialog: false, deleteDialog: false }));
        setInputValue(initialInputValue);
    };
    const editRow = (user) => {
        const { UserId, Name, UserName, UserTypeId, Password, BranchId } = user;
        const decryptedPassword = decryptPasswordFun(Password);
        setInputValue(pre => ({ ...pre, UserId, Name, UserName, UserTypeId, Password: decryptedPassword, BranchId }));
        setScreen(true);
    };




    const handleDeleteConfirm = () => {
        fetchLink({
            address: `masters/users`,
            method: "DELETE",
            bodyData: { UserId: inputValue.UserId, },
        }).then((data) => {
            if (data.success) {
                setReload(!reload);
                setDialog(pre => !pre);
                setInputValue(initialState);
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        })
            .catch((error) => {
                console.error("Error deleting user:", error);
                toast.error("An error occurred. Please try again later.");
            });
    };


    const OnCostCenterSubmit = (e) => {
        e.preventDefault();
        if (loadingOn) loadingOn();



        fetchLink({
            address: `dataEntry/costCenter`,
            method: 'POST',
            bodyData: {
                Cost_Center_Id: inputValuecost?.Cost_Center_Id,
                Cost_Center_Name: inputValuecost?.Name,
                User_Type: inputValuecost?.UserTypeId,
                User_Id: Number(inputValuecost?.UserId),
                Is_Converted_To_User: inputValuecost?.Is_Converted_To_User
            }
        })
            .then(data => {
                if (data.success) {
                    toast.success(data.message);
                    closeDialog();
                    setReload(!reload);
                    // refresh();
                } else {
                    toast.error(data.message);
                }
            })
            .catch(e => console.error(e))
            .finally(() => {
                if (loadingOff) loadingOff();
            });
    };

    const refresh = () => setOthers(prev => ({ ...prev, refresh: !prev.refresh }));

    useEffect(() => {
        fetchLink({
            address: `masters/userTypecostcenter`
        }).then((data) => {
            if (data.success) {
                setUserType(data.data);
            }
        }).catch((e) => console.error(e));


    }, [parseData?.Company_id, reload]);




    return (
        <Fragment>
            <Card>
                <div className="px-3 py-2 fw-bold d-flex align-items-center justify-content-between border-bottom">
                    USERS
                    <div className="text-end">
                        <Button
                            onClick={switchScreen}
                            className="rounded-5 px-3 py-1 fa-13 shadow"
                        >
                            {!screen ? "Add User" : "Back"}
                        </Button>
                    </div>
                </div>

                <CardContent>


                    {!screen ? (
                        <>
                            <div className="d-flex justify-content-end">
                                <div className=" pb-2">
                                    <input
                                        value={filterInput}
                                        className="cus-inpt w-auto"
                                        placeholder="Search"
                                        onChange={e => setFilterInput(e.target.value)}
                                    />
                                </div>
                            </div>

                            <DataTable
                                data={filterInput ? filteredData.length > 0 ? filteredData : [] : usersData}
                                columns={[
                                    {
                                        name: 'Name',
                                        selector: val => val.Name,
                                        sortable: true,
                                    },
                                    {
                                        name: 'Type',
                                        selector: val => val.UserType,
                                        sortable: true,
                                    },
                                    {
                                        name: 'Mobile',
                                        selector: val => val.UserName,
                                        sortable: false,
                                    },
                                    {
                                        name: 'Company',
                                        selector: val => val.Company_Name,
                                        sortable: true,
                                    },
                                    {
                                        name: 'Company',
                                        selector: val => val.BranchName,
                                        sortable: true,
                                    },

                                    {
                                        name: 'Cost_Center_User',
                                        sortable: true,
                                        selector: val => (
                                            val?.Cost_Center_Id !== '' && val?.Cost_Center_Id !== null ? (
                                                <span>
                                                    <CheckIcon
                                                        // onClick={() => {

                                                        //     setInputValuecost({
                                                        //         Cost_Center_Id: val.Cost_Center_Id,
                                                        //         Name: val.Cost_Center_Name,  
                                                        //         UserType: val.UserType, 
                                                        //     });
                                                        //     setOthers(pre => ({ ...pre, dialog: true }));
                                                        // }}
                                                        style={{ cursor: 'pointer' }}
                                                    // disable
                                                    />
                                                </span>
                                            ) : (
                                                <AddBoxIcon
                                                    onClick={() => {

                                                        setInputValuecost({
                                                            Cost_Center_Id: null,
                                                            Name: val?.Name,
                                                            UserTypeId: val?.UserTypeId,
                                                            UserType: val?.UserType,
                                                            UserId: val?.UserId,
                                                            Is_Converted_To_User: 1
                                                        });
                                                        setOthers(pre => ({ ...pre, dialog: true }));
                                                    }}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            )
                                        ),
                                    },

                                    {
                                        name: 'CostCenterType',
                                        selector: val => (
                                            val?.costcentertype !== '' && val?.costcentertype !== null ? (
                                                <span>
                                                    {val?.costcentertype}
                                                </span>
                                            ) : (
                                                <span className="cus-badge text-black ">-</span>
                                            )
                                        ),
                                        sortable: true,
                                    },
                                    {
                                        name: 'Action',
                                        cell: val => (
                                            <>
                                                <IconButton onClick={() => { editRow(val) }} size="small">
                                                    <Edit className="fa-in" />
                                                </IconButton>
                                                <IconButton onClick={() => {
                                                    const { UserId, Name, UserName, UserTypeId, Password, BranchId } = val;
                                                    setInputValue(pre => ({ ...pre, UserId, Name, UserName, UserTypeId, Password, BranchId }));
                                                    setDialog(true);
                                                }} size="small">
                                                    <Delete className="fa-in del-red" />
                                                </IconButton>
                                            </>
                                        ),
                                    },
                                ]}
                                direction="auto"
                                fixedHeader
                                fixedHeaderScrollHeight="63dvh"
                                highlightOnHover
                                pagination
                                responsive
                                striped
                                subHeaderAlign="right"
                                subHeaderWrap
                            />

                        </>
                    ) : (
                        <>
                            <form onSubmit={e => {
                                e.preventDefault();
                                saveUser();
                            }}>
                                <div className="row p-3">

                                    <div className="col-lg-4 col-md-6 p-2">
                                        <label>Name</label>
                                        <input
                                            className="cus-inpt"
                                            value={inputValue.Name}
                                            required
                                            minLength={3}
                                            onChange={e =>
                                                setInputValue({ ...inputValue, Name: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div className="col-lg-4 col-md-6 p-2">
                                        <label>Password</label>
                                        <input
                                            className="cus-inpt"
                                            type="password"
                                            required
                                            minLength={6}
                                            value={inputValue.Password}
                                            onChange={(e) =>
                                                setInputValue({ ...inputValue, Password: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div className="col-lg-4 col-md-6 p-2">
                                        <label>Mobile</label>
                                        <input
                                            className="cus-inpt"
                                            type={"number"}
                                            required
                                            value={inputValue.UserName}
                                            maxLength={10}
                                            onChange={(e) =>
                                                setInputValue({ ...inputValue, UserName: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div className="col-lg-4 col-md-6 p-2">
                                        <label>Branch</label>
                                        <select
                                            className="cus-inpt"
                                            value={inputValue.BranchId}
                                            required
                                            onChange={(e) =>
                                                setInputValue({ ...inputValue, BranchId: e.target.value })
                                            }
                                        >
                                            <option value={""}>select</option>
                                            {branch?.map((o, i) => (
                                                <option key={i} value={o.BranchId}>
                                                    {o.BranchName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* 

                                    <div className="col-lg-4 col-md-6 p-2">
                                        <label>Company</label>
                                        <select
                                            className="cus-inpt"
                                            value={inputValue.Company_Id}
                                            required
                                            onChange={(e) =>
                                                setInputValue({ ...inputValue, Company_Id: e.target.value })
                                            }
                                        >
                                            <option value={""}>select</option>
                                            {companyData?.map((o, i) => (
                                                <option key={i} value={o.ID}>
                                                    {o.Name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    */}

                                    <div className="col-lg-4 col-md-6 p-2">
                                        <label>User Type</label>
                                        <select
                                            className="cus-inpt"
                                            value={inputValue.UserTypeId}
                                            required
                                            onChange={(e) =>
                                                setInputValue({ ...inputValue, UserTypeId: e.target.value })
                                            }
                                        >
                                            <option value=''>Select</option>
                                            {userTypeDropDown?.map((o, i) => (
                                                <option key={i} value={o.Id}>
                                                    {o.UserType}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="pe-3 d-flex justify-content-end">
                                    <Button
                                        className="rounded-5 px-4 mx-1 btn-light bg-white"
                                        onClick={switchScreen}
                                        type='button'
                                    >
                                        cancel
                                    </Button>
                                    <Button
                                        className="rounded-5 px-4 shadow mx-1"
                                        type='submit'
                                    >
                                        {inputValue.UserId ? "Update" : "Create"}
                                    </Button>
                                </div>
                            </form>
                        </>
                    )}
                </CardContent>
            </Card>

            <Dialog
                open={dialog}
                onClose={() => setDialog(false)}
                fullWidth maxWidth='sm'
            >
                <DialogTitle id="alert-dialog-title">Confirmation</DialogTitle>
                <DialogContent>
                    <b className="text-muted">
                        Do you want to Delete the user <span className="blue-text">{inputValue.Name}</span>?
                    </b>
                </DialogContent>
                <DialogActions>
                    <Button
                        className=" btn-light"
                        onClick={() => {
                            setDialog(false);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteConfirm}>Delete</Button>
                </DialogActions>
            </Dialog>


            <Dialog
                open={others.dialog}
                onClose={closeDialog}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>{inputValuecost.Cost_Center_Id ? 'Modify Records' : 'Add Records'}</DialogTitle>

                <form onSubmit={OnCostCenterSubmit}>
                    <DialogContent>
                        <div className="table-responsive">
                            <table className="table m-0">
                                <tbody>
                                    <tr>
                                        <Td>Cost Center Name <RequiredStar /></Td>
                                        <Td>
                                            <input
                                                value={inputValuecost.Name}
                                                onChange={e => setInputValuecost(prev => ({ ...prev, Name: e.target.value }))}
                                                className="cus-inpt p-2"
                                                required
                                                maxLength={150}
                                            />
                                        </Td>
                                    </tr>
                                    <tr>
                                        <Td>User Type <RequiredStar /></Td>
                                        <Td>
                                            <select
                                                value={inputValuecost.UserTypeId || ''}  // Make sure the value is consistent
                                                onChange={e => setInputValuecost(prev => ({ ...prev, UserTypeId: e.target.value }))}
                                                className="cus-inpt p-2"
                                                required
                                                aria-label="Select User Type"
                                            >
                                                <option value="">Select User Type</option>
                                                {usertypes.map((UserTypeItem, index) => (
                                                    <option key={index} value={UserTypeItem.UserTypeId}>
                                                        {UserTypeItem.UserType}
                                                    </option>
                                                ))}
                                            </select>
                                        </Td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </DialogContent>
                    <DialogActions className="d-flex justify-content-between flex-wrap">
                        <Button type="button" variant="outlined" onClick={() => setInputValuecost({ Cost_Center_Id: null, Name: '', UserTypeId: '' })}>Clear</Button>
                        <span>
                            <Button type="button" onClick={closeDialog}>Cancel</Button>
                            <Button type="submit" variant="contained">Submit</Button>
                        </span>
                    </DialogActions>
                </form>
            </Dialog>


        </Fragment>
    );
}

export default Users;
