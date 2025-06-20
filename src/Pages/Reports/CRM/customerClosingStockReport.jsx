import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { Box, Tab } from "@mui/material";
import { useState } from "react";
import ClosingStockItemBasedReport from './itemWiseReport';
import ClosingStockRetailerBasedReport from './ledgerBased';
// import RetailerClosingStock from '../../UserModule/retailer/closingStockRetailerBasedReport';
import LedgerBasedClosingStock from './ledgerBasedStock';
import SalesPersonWiseGroupedLedgerClosingStock from './salesPersonWiseGroup';

const CustomerClosingStockReport = ({ loadingOn, loadingOff }) => {
    const [tabValue, setTabValue] = useState(1);

    return (
        <>
            <TabContext value={tabValue}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <TabList
                        indicatorColor='transparant'
                        onChange={(e, n) => setTabValue(n)}
                        variant='scrollable'
                        scrollButtons="auto"
                    >
                        <Tab
                            sx={tabValue === 1 ? { backgroundColor: '#c6d7eb' } : {}}
                            label={'Item Wise'}
                            value={1}
                        />
                        <Tab
                            sx={tabValue === 2 ? { backgroundColor: '#c6d7eb' } : {}}
                            label={'Ledger Wise'}
                            value={2}
                        />
                        <Tab
                            sx={tabValue === 3 ? { backgroundColor: '#c6d7eb' } : {}}
                            label={'Brand Wise'}
                            value={3}
                        />
                        <Tab
                            sx={tabValue === 4 ? { backgroundColor: '#c6d7eb' } : {}}
                            label={'Sales-Person Based'}
                            value={4}
                        />
                        <Tab
                            sx={tabValue === 5 ? { backgroundColor: '#c6d7eb' } : {}}
                            label={'Live Stock'}
                            value={5}
                        />
                    </TabList>
                </Box>

                <TabPanel value={1} sx={{ p: 0, pt: 2 }}>
                    <ClosingStockItemBasedReport loadingOn={loadingOn} loadingOff={loadingOff} />
                </TabPanel>
                <TabPanel value={2} sx={{ p: 0, pt: 2 }}>
                    <LedgerBasedClosingStock loadingOn={loadingOn} loadingOff={loadingOff} />
                </TabPanel>
                <TabPanel value={3} sx={{ p: 0, pt: 2 }}>
                    <LedgerBasedClosingStock loadingOn={loadingOn} loadingOff={loadingOff} grouped={true} />
                </TabPanel>
                <TabPanel value={4} sx={{ p: 0, pt: 2 }}>
                    <SalesPersonWiseGroupedLedgerClosingStock loadingOn={loadingOn} loadingOff={loadingOff} />
                </TabPanel>
                <TabPanel value={5} sx={{ p: 0, pt: 2 }}>
                    <ClosingStockRetailerBasedReport loadingOn={loadingOn} loadingOff={loadingOff} />
                </TabPanel>
            </TabContext>
        </>
    )
}

export default CustomerClosingStockReport;