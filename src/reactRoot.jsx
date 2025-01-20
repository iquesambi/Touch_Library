import {Sidebar} from "./solved-sidebarPresenter.jsx";
import {Search} from "./solved-searchPresenter.jsx";
import {Summary} from "./solved-summaryPresenter.jsx";
import {Details} from "./solved-detailsPresenter.jsx";

import {observer} from "mobx-react-lite";

import {  createHashRouter,  RouterProvider } from "react-router-dom";

function makeRouter(model){
    return createHashRouter(
[
    {
        path: "/",
        element: <Search model={model} />,
    },
    {
        path: "/search",
        element: <Search model={model} />,
    },
    {
        path: "/details", 
        element: <Details model={model} />
    },
    {
        path: "/summary" ,
        element: <Summary model={model} />
    },
]);
}
	

//import { useLocation, useNavigate } from "react-router-dom";
// const navigate= useNavigate()

// <BrowserRouter basename="/react/index.html">
//window.history.pushState("", "", "/react/index.html/details")
//dispatchEvent(new PopStateEvent('popstate', {}))
// addEventListener('popstate', e =>  console.log(e));

const ReactRoot = observer(
    function ReactRootRender(props){
       return   !props.model.ready && <img src="http://www.csc.kth.se/~cristi/loading.gif"/> ||
            <div className="flexParent">
		<div className="sidebar"><Sidebar model={props.model} /></div>
		<div className="mainContent">    <RouterProvider router={makeRouter(props.model)} />     </div>
            </div>
	;
    }
);

export {ReactRoot}
