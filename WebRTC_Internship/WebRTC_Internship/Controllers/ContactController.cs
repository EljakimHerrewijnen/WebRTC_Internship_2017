using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace WebRTC_Internship.Controllers
{
    [RequireHttps]
    [Authorize]
    [Route("[controller]/[action]")]
    public class ContactController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
        public IActionResult Home()
        {
            return View();
        }
        public IActionResult Addcontact()
        {
            return View();
        }

        public IActionResult Personal()
        {
            return View();
        }

        [HttpGet("{contactid}")]
        public IActionResult Callcontact()
        {
            return Redirect("www.nu.nl");
        }

        [HttpGet("{contactid}")]
        public IActionResult ShowContact()
        {
            return View();
        }
    }
}